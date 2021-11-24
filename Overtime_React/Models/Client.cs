using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
namespace Overtime_React.Models
{
   
        public class AppUser
        {
            [Key]
            public string iD { get; set; }
            public string FullName { get; set; }
            [DataType(DataType.Password)]
            [JsonIgnore]
            public byte[] PasswordHash { get; set; }
            [JsonIgnore]
            public byte[] PasswordSalt { get; set; }
            [JsonIgnore]
            public List<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        }

        [Owned]
        public class RefreshToken
        {
            [Key]
            [JsonIgnore]
            public string iD { get; set; }

            public string Token { get; set; }
            public DateTime Expires { get; set; }
            public bool IsExpired => DateTime.UtcNow >= Expires;
            public DateTime Created { get; set; }
            public string CreatedByIp { get; set; }
            public DateTime Revoked { get; set; }
            public string RevokedByIp { get; set; }
            public string ReplacedByToken { get; set; }
            public bool IsActive => Revoked == null && !IsExpired;
        }

        public class LoginsHistory
        {
            [Key]
            public string id { get; set; }
            public string loginDate { get; set; }
            public string userName { get; set; }
        }
    }

