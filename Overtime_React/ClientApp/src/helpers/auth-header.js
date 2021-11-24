import { authenticationService } from '../services/authentication.service';

export function authHeader() {
    const currentUser = JSON.parse(authenticationService.currentUserValue);
    if (currentUser && currentUser.jwtToken) {
     
        return `Bearer ${currentUser.jwtToken}`;
    } else {
        return {};
    }
}