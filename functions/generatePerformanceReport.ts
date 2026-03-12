import { jsPDF } from "npm:jspdf@4.0.0";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { month, tasksInMonth, completedTasks, completionRate, delayedTasks, assigneeMetrics } = body;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59);
    doc.text("Relatório de Performance", 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Período: ${month}`, 20, yPosition);

    yPosition += 20;

    // Key Metrics Section
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Métricas Gerais", 20, yPosition);
    yPosition += 10;

    const metricsData = [
      { label: "Total de Tarefas", value: tasksInMonth },
      { label: "Tarefas Concluídas", value: completedTasks },
      { label: "Taxa de Conclusão", value: `${completionRate}%` },
      { label: "Tarefas Atrasadas", value: delayedTasks }
    ];

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    metricsData.forEach((metric) => {
      doc.text(`${metric.label}: ${metric.value}`, 30, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Team Productivity Section
    if (assigneeMetrics.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Produtividade por Colaborador", 20, yPosition);
      yPosition += 12;

      // Table
      const tableData = assigneeMetrics
        .sort((a, b) => b.productivity - a.productivity)
        .slice(0, 20)
        .map((metric) => [
          metric.email.split("@")[0],
          String(metric.total),
          String(metric.completed),
          String(metric.inProgress),
          String(metric.pending),
          String(metric.delayed),
          `${metric.productivity}%`
        ]);

      doc.autoTable({
        startY: yPosition,
        head: [["Colaborador", "Total", "Concluídas", "Em Andamento", "Pendentes", "Atrasadas", "Produtividade"]],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 5,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240]
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: "bold"
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Summary
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text("Resumo", 20, yPosition);
    yPosition += 10;

    const summaryText = [
      `Durante o período de ${month}, foram rastreadas ${tasksInMonth} tarefas.`,
      `Destas, ${completedTasks} foram concluídas com sucesso, representando uma taxa de conclusão de ${completionRate}%.`,
      `Foram identificadas ${delayedTasks} tarefas com atraso em relação às datas previstas.`,
      `A equipe apresentou um total de ${assigneeMetrics.length} colaboradores ativos no período.`
    ];

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    summaryText.forEach((line) => {
      const wrappedText = doc.splitTextToSize(line, pageWidth - 40);
      doc.text(wrappedText, 20, yPosition);
      yPosition += wrappedText.length * 6 + 4;
    });

    // Generate PDF
    const pdfBuffer = doc.output("arraybuffer");

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-performance-${month}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});