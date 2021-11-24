using System;
using System.Collections.Generic;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using Overtime_React.Models;

namespace Overtime_React.Data
{
    public class XlxsCreation
    {
        public XlxsCreation(List<DaysData> data, string _path)
        {
            using (SpreadsheetDocument ReportTable = SpreadsheetDocument.Create(_path, SpreadsheetDocumentType.Workbook))
            {
                WorkbookPart workbookPart = ReportTable.AddWorkbookPart();
                workbookPart.Workbook = new Workbook();

                WorksheetPart worksheetPart = workbookPart.AddNewPart<WorksheetPart>();
                SheetData sheetData = new SheetData();
                worksheetPart.Worksheet = new Worksheet(sheetData);

                Sheets sheets = ReportTable.WorkbookPart.Workbook.AppendChild<Sheets>(new Sheets());

                Sheet _sheet = new Sheet()
                {
                    Id = ReportTable.WorkbookPart.GetIdOfPart(worksheetPart),
                    SheetId = 1,
                    Name = "Overtime_Days"
                };

                sheets.Append(_sheet);
                Row headerRow = new Row();
                List<string> _columns = new List<string>();
                foreach (string headers in ExportDataTypes.DateRow)
                {
                    Cell _cell = new Cell();
                    _cell.DataType = CellValues.String;
                    _cell.CellValue = new CellValue(headers);
                    headerRow.AppendChild(_cell);
                }
                sheetData.AppendChild(headerRow);
                int _index = 0;
                int totalSumm = 0;
                foreach (DaysData dayData in data)
                {
                    Row dateRow = new Row();

                    Cell DateCell = new Cell();
                    DateCell.DataType = CellValues.String;
                    DateCell.CellValue = new CellValue(dayData.date);
                    Cell HolidayCell = new Cell();
                    HolidayCell.DataType = CellValues.String;
                    HolidayCell.CellValue = new CellValue(dayData.holiday ? "выходной" : "");
                    Cell PlaceCell = new Cell();
                    PlaceCell.DataType = CellValues.String;
                    PlaceCell.CellValue = new CellValue(dayData.place);
                    Cell TimeCell = new Cell();
                    TimeCell.DataType = CellValues.String;
                    TimeCell.CellValue = new CellValue(dayData.fromTime + " - " + dayData.toTime);
                    Cell TotalTimeCell = new Cell();
                    TotalTimeCell.DataType = CellValues.String;
                    TotalTimeCell.CellValue = new CellValue(dayData.totalTime);
                    Cell OtherPaysCell = new Cell();
                    OtherPaysCell.DataType = CellValues.Number;
                    OtherPaysCell.CellValue = new CellValue(dayData.otherPays.ToString());
                    Cell TotalCostCell = new Cell();
                    TotalCostCell.DataType = CellValues.Number;
                    TotalCostCell.CellValue = new CellValue((dayData.cost + dayData.otherPays).ToString());

                    dateRow.AppendChild(DateCell);
                    dateRow.AppendChild(HolidayCell);
                    dateRow.AppendChild(PlaceCell);
                    dateRow.AppendChild(TimeCell);
                    dateRow.AppendChild(TotalTimeCell);
                    dateRow.AppendChild(OtherPaysCell);
                    dateRow.AppendChild(TotalCostCell);
                    sheetData.AppendChild(dateRow);
                    _index = _index++;
                    totalSumm = totalSumm + (dayData.cost + dayData.otherPays);
                }
                Row totalSummRow = new Row();
                Cell TotalSummCellLabel = new Cell();
                TotalSummCellLabel.DataType = CellValues.String;
                TotalSummCellLabel.CellValue = new CellValue("Сумма: ");
                Cell TotalSummCell = new Cell();
                TotalSummCell.DataType = CellValues.Number;
                TotalSummCell.CellValue = new CellValue(totalSumm.ToString());
                totalSummRow.AppendChild(TotalSummCellLabel);
                totalSummRow.AppendChild(TotalSummCell);
                sheetData.AppendChild(totalSummRow);
                workbookPart.Workbook.Save();
                ReportTable.Close();

            }
        }
    }
}
