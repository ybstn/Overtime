import { authenticationService } from '../services/authentication.service';

export function handleResponse(response)
{

    if (!response.ok) {
        
        if ([401, 403].indexOf(response.status) !== -1) {
     
            // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
            authenticationService.logout();
            window.location.reload(true);
        }

        return null;
    }
    return null;
}
