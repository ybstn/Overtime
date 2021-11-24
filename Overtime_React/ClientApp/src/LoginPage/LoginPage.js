import React from 'react';
import { Form, FormGroup, Label, Input, Button, Row } from 'reactstrap';

import { authenticationService } from '../services/authentication.service';

export class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { login: "", password: "", errors: [], errorsMsg: [] };
        this.onSubmit = this.onSubmit.bind(this);
        this.handleLoginChange = this.handleLoginChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.validate = this.validate.bind(this);
        this.applyErrorClass = this.applyErrorClass.bind(this);
        this.applyErrorText = this.applyErrorText.bind(this);
        // redirect to home if already logged in
        if (authenticationService.currentUserValue) {
            this.props.history.push('/');
        }
        else {

        }
    }
    handleLoginChange(e) {
        this.setState({ login: e.target.value });
    }
    handlePasswordChange(e) {
        this.setState({ password: e.target.value });
    }
    componentDidMount() {
        const currentUser = authenticationService.currentUserValue;

        if (!currentUser && localStorage.getItem('AuthError')) {

            let tempMsg = {};
            tempMsg.wrongvalues = "Неверный логин или пароль";
            this.setState({ errorsMsg: tempMsg });
        }



    }
    validate() {
        let temp = {};
        temp.login = this.state.login === "" ? false : true;
        temp.password = this.state.password === "" ? false : true;
        this.setState({ errors: temp });

        let tempMsg = {};
        tempMsg.login = this.state.login === "" ? "Введите логин" : "";
        tempMsg.password = this.state.password === "" ? "Введите пароль" : "";
        this.setState({ errorsMsg: tempMsg });

        return Object.values(temp).every(x => x === true);
    }
    applyErrorClass(field) {
        let tempstyle = (field in this.state.errors && this.state.errors[field] === false) ? "invalid-field" : "";
        return tempstyle;
    }
    applyErrorText(field) {
        let errorMsg = (field in this.state.errorsMsg && this.state.errorsMsg[field] !== "") ? this.state.errorsMsg[field] : "";
        return errorMsg;
    }
    onSubmit(e) {
        if (this.validate()) {
            var user = authenticationService.login(this.state.login, this.state.password);

            if (user.status === "200") {
                localStorage.removeItem('AuthError');
                const { from } = this.props.location.state || { from: { pathname: "/" } };

                this.props.history.push(from);
            }
            else {
                localStorage.setItem('AuthError', true);
            }



        }

    }
    render() {

        return (
            <div className="LoginDivCenter">
                <div>
                    <Row className="justify-content-center py-2 text-center">

                        <h2>Вход на сайт</h2>

                    </Row>
                    <Row className="justify-content-center py-2">

                        <Form onSubmit={this.onSubmit}>

                            <FormGroup className="text-center">
                                <Label htmlFor="login">Логин</Label>
                                <Input name="login" type="text"
                                    className={"form-control" + this.applyErrorClass('login')}
                                    id="loginInput"
                                    placeholder="Ваш логин"
                                    onChange={this.handleLoginChange} />
                                <div className="invalid-field">{this.applyErrorText('login')}</div>
                            </FormGroup>
                            <FormGroup className="mt-2 text-center">
                                <Label htmlFor="password">Пароль</Label>
                                <Input name="password" type="password"
                                    className={"form-control" + this.applyErrorClass('password')}
                                    id="passwordInput"
                                    placeholder="Ваш пароль"
                                    onChange={this.handlePasswordChange} />
                                <div className="invalid-field">{this.applyErrorText('password')}</div>
                            </FormGroup>
                            <FormGroup>
                                <Button type="submit" className="btn btn-secondary w-100 mt-4" size="lg" block>Войти</Button>
                                <div className="invalid-field">{this.applyErrorText('wrongvalues')}</div>
                            </FormGroup>

                        </Form>

                    </Row>

                </div>
            </div>
        )
    }
}