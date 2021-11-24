using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using Overtime_React.Helpers;
using Overtime_React.Models;
using System.Security.Cryptography;
using TimeZoneConverter;
using System.Threading.Tasks;
using System.Xml.Linq;
using System.Globalization;
using Microsoft.AspNetCore.Hosting;
using System.IO;

namespace Overtime_React.Services
{
    public interface IUserService
    {
        AuthenticateResponse Authenticate(AuthenticateRequest model, string ipAddress);
        AuthenticateResponse RefreshToken(string token, string ipAddress);
        bool RevokeToken(string token, string ipAddress);
        AppUser Create(AppUser user, string Inpassword);

        IEnumerable<AppUser> GetAll();
        AppUser GetById(string id);
    }
    public class UserService : IUserService
    {
        TimeZoneInfo _TimeZoneinfo = TZConvert.GetTimeZoneInfo("Russian Standard Time");
        private readonly AppSettings _appSettings;
        private readonly List<AppUser> _UsersList = new List<AppUser>();
        private XDocument UsersXml;
        private XDocument LoginHistoryXML;
        private readonly IWebHostEnvironment _env;
        private string webRoot;
        private string contRoot;
        public UserService(IOptions<AppSettings> appSettings, IWebHostEnvironment env)
        {
            _appSettings = appSettings.Value;
            _env = env;
            //if (string.IsNullOrWhiteSpace(_env.WebRootPath))
            //{
            //     webRoot = Path.Combine(Directory.GetCurrentDirectory(), "");
                
            //}
            webRoot = _env.WebRootPath;
            contRoot = _env.ContentRootPath;
            XmlLoad();


        }

        private void XmlLoad()
        {
            UsersXml = XDocument.Load(System.IO.Path.Combine(contRoot, "Data/Users.xml"));
            LoginHistoryXML = XDocument.Load(System.IO.Path.Combine(contRoot, "Data/LoginHistory.xml"));
            var _usersXMLList = UsersXml.Element("AppUsers").Elements("user").ToList();
            if (_usersXMLList.Count()!=0)
            {
                foreach (var user in _usersXMLList)
                {
                    AppUser CurrUser = new AppUser()
                    {
                        iD = user.Element("id").Value,
                        FullName = user.Element("fullname").Value,
                        PasswordHash = System.Convert.FromBase64String(user.Element("PasswordHash").Value),
                        PasswordSalt = System.Convert.FromBase64String(user.Element("PasswordSalt").Value)
                    };
                    _UsersList.Add(CurrUser);
                    foreach (var Rtoken in user.Element("RefreshTokens").Elements("Rtoken"))
                    {
                        RefreshToken CurrToken = new RefreshToken()
                        {
                            iD = Rtoken.Element("id").Value,
                            Token = Rtoken.Element("Token").Value,
                            Expires = DateTime.ParseExact(Rtoken.Element("Expires").Value, "yyyy-MM-dd HH:mm:ss.ffffff", CultureInfo.InvariantCulture),
                            Created = DateTime.ParseExact(Rtoken.Element("Created").Value, "yyyy-MM-dd HH:mm:ss.ffffff", CultureInfo.InvariantCulture),
                            CreatedByIp = Rtoken.Element("CreatedByIp").Value,
                            Revoked = DateTime.ParseExact(Rtoken.Element("Revoked").Value, "yyyy-MM-dd HH:mm:ss.ffffff", CultureInfo.InvariantCulture),
                            RevokedByIp = Rtoken.Element("RevokedByIp").Value,
                            ReplacedByToken = Rtoken.Element("ReplacedByToken").Value,

                        };
                        _UsersList.Find(x => x.iD == CurrUser.iD).RefreshTokens.Add(CurrToken);
                    }
                }
            }
        }

        public AuthenticateResponse Authenticate(AuthenticateRequest model, string ipAddress)
        {
            
            var user = _UsersList.SingleOrDefault(x => x.FullName == model.FullName);
            // return null if user not found
            if (user == null) return null;
            // check if password is correct
            if (!VerifyPasswordHash(model.Password, user.PasswordHash, user.PasswordSalt))
                return null;
            // authentication successful so generate jwt token

            var jwtToken = generateJwtToken(user);
            RefreshToken refreshToken = generateRefreshToken(ipAddress);

            //if (!user.RefreshTokens.Contains(refreshToken))
            //{
            user.RefreshTokens.Add(refreshToken);
            TokenXmlSave(user, refreshToken);
            
            string nowDate = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _TimeZoneinfo).ToString("dd.MM.yyyy HH:mm:ss");
            LoginsHistory logHist = new LoginsHistory()
            {
                id = Guid.NewGuid().ToString(),
                userName = user.FullName,
                loginDate = nowDate

            };
            LoginHistoryXML.Element("LoginHistory").Add
                (
                new XElement("login",
                new XElement("id", logHist.id),
                new XElement("loginDate", logHist.loginDate),
                new XElement("userName", logHist.userName)
                )
            );
            LoginHistoryXML.Save(System.IO.Path.Combine(contRoot, "Data/LoginHistory.xml"));
       

            return new AuthenticateResponse(user, jwtToken, refreshToken.Token);
        }
        public AppUser Create(AppUser user, string Inpassword)
        {
            // validation
            string password = Inpassword;
            byte[] passwordHash = null;
            byte[] passwordSalt;
            CreatePasswordHash(password, out passwordHash, out passwordSalt);

            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;

           
            if (_UsersList == null)
            {
                _UsersList.Add(user);
            }
            if (_UsersList.Exists(x => x.FullName == user.FullName))
            {
                UsersXml.Element("AppUsers").Elements("user").First(x => x.Element("id").Value == _UsersList.First(x => x.FullName == user.FullName).iD).ReplaceWith
                (
                    new XElement("user",
                new XElement("id", user.iD),
                new XElement("fullname", user.FullName),
                new XElement("PasswordHash", System.Convert.ToBase64String(user.PasswordHash)),
                new XElement("PasswordSalt", System.Convert.ToBase64String(user.PasswordSalt)),
                new XElement("RefreshTokens", user.RefreshTokens)
                )
                );
            }
            else
            {
                var id = Guid.NewGuid().ToString();
                user.iD = id;
                UsersXml.Element("AppUsers").Add
                (
                new XElement("user",
                new XElement("id", user.iD),
                new XElement("fullname", user.FullName),
                new XElement("PasswordHash", System.Convert.ToBase64String(user.PasswordHash)),
                new XElement("PasswordSalt", System.Convert.ToBase64String(user.PasswordSalt)),
                new XElement("RefreshTokens", "")
                )
            );
                string UserDateFolder = "UsersData/" + user.iD + "/";
                string path = System.IO.Path.Combine(webRoot, UserDateFolder);
                string XMLpath = path + user.FullName+".xml";
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                    XDocument UserDoc = new XDocument(
                        new XElement("Overtime",
                        new XElement("days"),
                        new XElement("salaryList"),
                        new XElement("settings",
                        new XAttribute("OvertimeHourStart","8"),
                        new XAttribute("HourMinuteRound", "30"),
                        new XAttribute("OvertimeHourCost","400"), 
                        new XAttribute("HolidayNightCost", "3000"))));
                    UserDoc.Save(XMLpath);
                }
            }
            UsersXml.Save(System.IO.Path.Combine(contRoot, "Data/Users.xml"));

            return user;
        }
        public AuthenticateResponse RefreshToken(string token, string ipAddress)
        {

            var user = _UsersList.SingleOrDefault(u => u.RefreshTokens.Any(t => t.Token == token));

            // return null if no user found with token
            if (user == null) return null;

            var refreshToken = user.RefreshTokens.Single(x => x.Token == token);

            // return null if token is no longer active
            if (!refreshToken.IsActive) return null;

            // replace old refresh token with a new one and save
            var newRefreshToken = generateRefreshToken(ipAddress);
            refreshToken.Revoked = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _TimeZoneinfo);
            refreshToken.RevokedByIp = ipAddress;
            refreshToken.ReplacedByToken = newRefreshToken.Token;
            user.RefreshTokens.Add(newRefreshToken);

            TokenXmlSave(user, refreshToken);

            // generate new jwt
            var jwtToken = generateJwtToken(user);

            return new AuthenticateResponse(user, jwtToken, newRefreshToken.Token);
        }

        public bool RevokeToken(string token, string ipAddress)
        {
            var user = _UsersList.SingleOrDefault(u => u.RefreshTokens.Any(t => t.Token == token));

            // return false if no user found with token
            if (user == null) return false;

            var refreshToken = user.RefreshTokens.Single(x => x.Token == token);

            // return false if token is not active
            if (!refreshToken.IsActive) return false;

            // revoke token and save
            refreshToken.Revoked = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _TimeZoneinfo); ;
            refreshToken.RevokedByIp = ipAddress;
            TokenXmlSave(user, refreshToken);

            return true;
        }

        private DateTime UnixTimeStampToDateTime(double unixTimeStamp)
        {
            // Unix timestamp is seconds past epoch
            System.DateTime dtDateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, System.DateTimeKind.Utc);
            dtDateTime = dtDateTime.AddSeconds(unixTimeStamp).ToUniversalTime();
            return dtDateTime;
        }

        public IEnumerable<AppUser> GetAll()
        {
            return _UsersList;
        }

        public AppUser GetById(string id)
        {
            return _UsersList.FirstOrDefault(x => x.iD == id);
        }

        private void TokenXmlSave(AppUser user, RefreshToken refreshToken)
        {
            UsersXml.Element("AppUsers").Elements("user").First(x => x.Element("id").Value == user.iD)
               .Element("RefreshTokens").Add
               (
               new XElement("Rtoken",
               new XElement("id", refreshToken.iD),
               new XElement("Token", refreshToken.Token),
                new XElement("Expires", refreshToken.Expires.ToString("yyyy-MM-dd HH:mm:ss.ffffff")),
               new XElement("Created", refreshToken.Created.ToString("yyyy-MM-dd HH:mm:ss.ffffff")),
               new XElement("CreatedByIp", refreshToken.CreatedByIp),
               new XElement("Revoked", refreshToken.Revoked.ToString("yyyy-MM-dd HH:mm:ss.ffffff")),
               new XElement("RevokedByIp", refreshToken.RevokedByIp),
               new XElement("ReplacedByToken", refreshToken.ReplacedByToken)
               )
           );
            UsersXml.Save(System.IO.Path.Combine(contRoot, "Data/Users.xml"));
        }

        private string generateJwtToken(AppUser user)
        {
            // generate token that is valid for 7 days
            var tokenHandler = new JwtSecurityTokenHandler();

            var key = Encoding.ASCII.GetBytes(_appSettings.Secret);
            var signInkey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] { new Claim("id", user.iD.ToString()) }),
                //Expires = DateTime.UtcNow.AddDays(7),
                Expires = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow.AddMinutes(1), _TimeZoneinfo),
                SigningCredentials = new SigningCredentials(signInkey, SecurityAlgorithms.HmacSha256)
                //SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
        private RefreshToken generateRefreshToken(string ipAddress)
        {
            using (var rngCryptoServiceProvider = new RNGCryptoServiceProvider())
            {
                var randomBytes = new byte[64];
                rngCryptoServiceProvider.GetBytes(randomBytes);
                return new RefreshToken
                {
                    iD = Guid.NewGuid().ToString(),

                    Token = Convert.ToBase64String(randomBytes),
                    //Expires = DateTime.UtcNow.AddDays(7),
                    Expires = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow.AddMinutes(1), _TimeZoneinfo),
                    Created = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _TimeZoneinfo),
                    CreatedByIp = ipAddress
                };
            }
        }

        private static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            if (password == null) throw new ArgumentNullException("password");
            if (string.IsNullOrWhiteSpace(password)) throw new ArgumentException("Value cannot be empty or whitespace only string.", "password");

            using (var hmac = new System.Security.Cryptography.HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
            }
        }

        private static bool VerifyPasswordHash(string password, byte[] storedHash, byte[] storedSalt)
        {
            if (password == null) throw new ArgumentNullException("password");
            if (string.IsNullOrWhiteSpace(password)) throw new ArgumentException("Value cannot be empty or whitespace only string.", "password");
            if (storedHash.Length != 64) throw new ArgumentException("Invalid length of password hash (64 bytes expected).", "passwordHash");
            if (storedSalt.Length != 128) throw new ArgumentException("Invalid length of password salt (128 bytes expected).", "passwordHash");

            using (var hmac = new System.Security.Cryptography.HMACSHA512(storedSalt))
            {
                var computedHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
                for (int i = 0; i < computedHash.Length; i++)
                {
                    if (computedHash[i] != storedHash[i]) return false;
                }
            }

            return true;
        }
    }
}
