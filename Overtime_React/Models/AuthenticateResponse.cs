using System;
using System.Text.Json.Serialization;
namespace Overtime_React.Models
{
    public class AuthenticateResponse
    {
        public string iD { get; set; }
        public string FullName { get; set; }
        public string JwtToken { get; set; }
        [JsonIgnore] // refresh token is returned in http only cookie
        public string RefreshToken { get; set; }

        public AuthenticateResponse(AppUser user, string jwtToken, string refreshToken)
        {
            iD = user.iD;
            FullName = user.FullName;
            JwtToken = jwtToken;
            RefreshToken = refreshToken;
        }
    }
}
