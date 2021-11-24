using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Overtime_React.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Xml.Linq;
using Overtime_React.Data;

namespace BraidcodeDB.Controllers
{
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [Route("[controller]")]
    public class HomeController : Controller
    {
        private XDocument UserDataXML;
        private readonly IWebHostEnvironment _env;
        private string webRoot;
        public HomeController(IWebHostEnvironment env)
        {
            _env = env;
            webRoot = env.WebRootPath;
            
        }
    
        [HttpGet]
        public IEnumerable<DaysData> Get(string id, string name)
        {
            List<DaysData> data = new List<DaysData>();
            XmlLoad(id, name);
            if (UserDataXML.Root.Element("days").HasElements)
            {
                data = (from node in UserDataXML.Root.Element("days").Elements("item")
                        select new DaysData
                        {
                            date = node.Attribute("date").Value,
                            holiday = Convert.ToBoolean(node.Attribute("holiday").Value),
                            place = node.Attribute("place").Value,
                            fromTime = node.Attribute("fromTime").Value,
                            toTime = node.Attribute("toTime").Value,
                            ovTime = node.Attribute("ovTime").Value,
                            totalTime = node.Attribute("totalTime").Value,
                            cost = int.Parse(node.Attribute("cost").Value),
                            otherPays = int.Parse(node.Attribute("otherPays").Value),
                            mailed = Convert.ToBoolean(node.Attribute("mailed").Value)
                        }).ToList();
            }
            return data;
        }

        [HttpPost]
        public IActionResult Post(string id, string name, DaysData data)
        {
            XmlLoad(id, name);
            if (UserDataXML.Root.Element("days").Element("item") != null)
            {
                if (UserDataXML.Root.Element("days").Elements("item").Any(x => x.Attribute("date").Value == data.date))
                {
                    if (data.cost != 0 || data.otherPays != 0)
                    {
                        XmlUpdateNode(data);
                    }
                    else
                    {
                        XmlDeleteNode(data.date);
                    }
                       
                }
                else
                {
                    if (data.cost != 0 || data.otherPays != 0)
                    {
                        XmlAddNode(data);
                    }
                }
            }
            else
            {
                if (data.cost != 0 || data.otherPays != 0)
                {
                    XmlAddNode(data);
                }
            }
            
            XmlSave(id, name);
            return Ok(data);
        }
        [HttpDelete]
        public IEnumerable<DaysData> Delete(string id, string name, string date)
        {
            List<DaysData> data = new List<DaysData>();
            XmlLoad(id, name);
            XmlDeleteNode(date);
            XmlSave(id, name);
            data = (from node in UserDataXML.Root.Element("days").Elements("item")
                    select new DaysData
                    {
                        date = node.Attribute("date").Value,
                        holiday = Convert.ToBoolean(node.Attribute("holiday").Value),
                        place = node.Attribute("place").Value,
                        fromTime = node.Attribute("fromTime").Value,
                        toTime = node.Attribute("toTime").Value,
                        ovTime = node.Attribute("ovTime").Value,
                        totalTime = node.Attribute("totalTime").Value,
                        cost = int.Parse(node.Attribute("cost").Value),
                        otherPays = int.Parse(node.Attribute("otherPays").Value),
                        mailed = Convert.ToBoolean(node.Attribute("mailed").Value)
                    }).ToList();
            return data;
        }
        [Route("[action]")]
        [HttpGet]
        public UserAppSettings GetSettings(string id, string name)
        {
            UserAppSettings data = new UserAppSettings();
            XmlLoad(id, name);
            XElement _xNode = UserDataXML.Root.Element("settings");
            data = new UserAppSettings
            {
                OvertimeHourStart = int.Parse(_xNode.Attribute("OvertimeHourStart").Value),
                HourMinuteRound = int.Parse(_xNode.Attribute("HourMinuteRound").Value),
                OvertimeHourCost = int.Parse(_xNode.Attribute("OvertimeHourCost").Value),
                HolidayNightCost = int.Parse(_xNode.Attribute("HolidayNightCost").Value),

            };
            return data;
        }
        [Route("[action]")]
        [HttpPost]
        public IActionResult PostSettings(string id, string name, UserAppSettings data)
        {
            XmlLoad(id, name);
            XElement _xNode = UserDataXML.Root.Element("settings");
            _xNode.Attribute("OvertimeHourStart").Value = data.OvertimeHourStart.ToString();
            _xNode.Attribute("HourMinuteRound").Value = data.HourMinuteRound.ToString();
            _xNode.Attribute("OvertimeHourCost").Value = data.OvertimeHourCost.ToString();
            _xNode.Attribute("HolidayNightCost").Value = data.HolidayNightCost.ToString();
            XmlSave(id, name);
            return Ok(data);
        }
        [Route("[action]")]
        [HttpPost]
        public string XlsxReport(string id, string name, List<DaysData> data)
        {
            string UserDateFolder = "UsersData/" + id + "/";
            string path = System.IO.Path.Combine(webRoot, UserDateFolder);
            string ReportPath = path + "Report.xlsx";
            XlxsCreation _CreateFile = new XlxsCreation(data, ReportPath);
            //DownloadFile(ReportPath);
            return ReportPath;
        }
        [Route("[action]")]
        [HttpGet("download")]
        public FileResult DownloadFile(string path)
        {
            var net = new System.Net.WebClient();
            var data = net.DownloadData(path);
            var content = new System.IO.MemoryStream(data);
            var contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            var fileName = System.IO.Path.GetFileName(path);
            return File(content, contentType, fileName);
        }
        private void XmlLoad(string id, string name)
        {
            string UserDateFolder = "UsersData/" + id + "/";
            string path = System.IO.Path.Combine(webRoot, UserDateFolder);
            string XMLpath = path + name + ".xml";
            string strXml;
            using (StreamReader sr = new StreamReader(XMLpath))
            {
                strXml = sr.ReadToEnd();
            }
            UserDataXML =  XDocument.Load(XMLpath);
        }
        private void XmlSave(string id, string name)
        {
            string UserDateFolder = "UsersData/" + id + "/";
            string path = System.IO.Path.Combine(webRoot, UserDateFolder);
            string XMLpath = path + name + ".xml";
            UserDataXML.Save(XMLpath);
        }
        private void XmlAddNode(DaysData data)
        {
            UserDataXML.Root.Element("days").Add
                       (
                       new XElement("item", "",
                       new XAttribute("date", data.date),
                        new XAttribute("holiday", data.holiday),
                         new XAttribute("place", data.place),
                          new XAttribute("fromTime", data.fromTime),
                           new XAttribute("toTime", data.toTime),
                            new XAttribute("ovTime", data.ovTime),
                             new XAttribute("totalTime", data.totalTime),
                              new XAttribute("cost", data.cost),
                               new XAttribute("otherPays", data.otherPays),
                                new XAttribute("mailed", data.mailed)
                       )
                   );
        }
        private void XmlUpdateNode(DaysData data)
        {
            XElement elem = UserDataXML.Root.Element("days").Elements("item").FirstOrDefault(x => x.Attribute("date").Value == data.date);

            elem.Attribute("date").Value = data.date;
             elem.Attribute("holiday").Value = data.holiday.ToString().ToLower();
              elem.Attribute("place").Value = data.place;
               elem.Attribute("fromTime").Value = data.fromTime;
                elem.Attribute("toTime").Value = data.toTime;
                 elem.Attribute("ovTime").Value = data.ovTime;
                  elem.Attribute("totalTime").Value = data.totalTime;
                   elem.Attribute("cost").Value = data.cost.ToString();
                    elem.Attribute("otherPays").Value = data.otherPays.ToString();
                     elem.Attribute("mailed").Value = data.mailed.ToString().ToLower();
        }
        private void XmlDeleteNode(string date)
        {
            UserDataXML.Root.Element("days").Elements("item").FirstOrDefault(x => x.Attribute("date").Value == date).Remove();
        }

        }
}
