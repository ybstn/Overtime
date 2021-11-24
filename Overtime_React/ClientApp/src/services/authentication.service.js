import { BehaviorSubject } from 'rxjs';
import { handleResponse } from '../helpers/handle-response';

const currentUserSubject = new BehaviorSubject(JSON.parse(localStorage.getItem('currentUser')));

export const authenticationService = {
    login,
    logout,
    refreshToken,
    currentUser: currentUserSubject.asObservable(),
    get currentUserValue() {
        return currentUserSubject.value
    }
};

function login(username, password) {
    const user = new FormData();
    user.append("FullName", username.toString());
    user.append("Password", password.toString());
    var xhr = new XMLHttpRequest();

    xhr.open("post", "/Account/authenticate", false);

    xhr.onload = function () {

        if (xhr.status === 200) {
            handleResponse(xhr.response);
            localStorage.setItem('currentUser', xhr.responseText);
            currentUserSubject.next(xhr.responseText);
            //????
            return xhr.responseText;
        }
        else {
            // ????
            return (xhr.statusText);
        }
    };
    xhr.send(user);
    return xhr;
}

function refreshToken() {
    var xhr = new XMLHttpRequest();
    //alert("Token refreshing");
    xhr.open("post", "/Account/refresh-token", true);

    xhr.onload = function () {
        if (xhr.status === 200) {
            handleResponse(xhr.response);
            localStorage.setItem('currentUser', JSON.stringify(xhr.responseText));
            currentUserSubject.next(xhr.responseText);
        }
    };
    xhr.send();
}

function logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    currentUserSubject.next(null);
}