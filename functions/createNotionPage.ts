import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskTitle, taskDescription, projectName, priority, endDate, taskId } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("notion");

    // Search for a parent page to put tasks under (use workspace root or find existing "Tarefas" page)
    const searchRes = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: "Tarefas",
        filter: { value: "page", property: "object" },
        page_size: 1
      })
    });

    const searchData = await searchRes.json();
    
    // Build page content
    const pageBody = {
      parent: searchData.results && searchData.results.length > 0
        ? { page_id: searchData.results[0].id }
        : { type: "workspace", workspace: true },
      icon: { type: "emoji", emoji: "📋" },
      properties: {
        title: {
          title: [{ type: "text", text: { content: taskTitle } }]
        }
      },
      children: [
        {
          object: "block",
          type: "callout",
          callout: {
            rich_text: [{ type: "text", text: { content: `Projeto: ${projectName || "Sem projeto"} | Prioridade: ${priority || "Média"} | Prazo: ${endDate || "Sem data"}` } }],
            icon: { type: "emoji", emoji: "ℹ️" },
            color: "blue_background"
          }
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Descrição" } }]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: taskDescription || "Adicione uma descrição aqui..." } }]
          }
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Desenvolvimento" } }]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: "" } }]
          }
        },
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Anotações" } }]
          }
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: "" } }]
          }
        }
      ]
    };

    const pageRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pageBody)
    });

    const pageData = await pageRes.json();

    if (!pageRes.ok) {
      return Response.json({ error: pageData.message || "Erro ao criar página no Notion" }, { status: 500 });
    }

    // Save the Notion page URL to the task
    const notionUrl = pageData.url;
    if (taskId) {
      await base44.asServiceRole.entities.Task.update(taskId, { linked_page_id: pageData.id });
    }

    return Response.json({ success: true, notionUrl, pageId: pageData.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});