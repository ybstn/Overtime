using System;
namespace Overtime_React.Models
{
    public class DaysData
    {
        public string date { get; set; }
        public bool holiday { get; set; }
        public string place { get; set; }
        public string fromTime { get; set; }
        public string toTime { get; set; }
        public string ovTime { get; set; }
        public string totalTime { get; set; }
        public int cost { get; set; }
        public int otherPays { get; set; }
        public bool mailed { get; set; }
    }
    public class FinanceData
    {
        public DateTime date { get; set; }
        public int value { get; set; }
        public string comment { get; set; }
        public bool isWaste { get; set; }
        public bool isPremium { get; set; }
    }
    public class SalaryData
    {
        public DateTime date { get; set; }
        public int value { get; set; }
    }
    public class UserAppSettings
    {
        public int OvertimeHourStart { get; set; }
        public int OvertimeHourCost { get; set; }
        public int HolidayNightCost { get; set; }
        public int HourMinuteRound { get; set; }
    }
}
