import React, { Component } from 'react';
import Button from 'react-bootstrap/Button';
//import Row from 'react-bootstrap/Row';
//import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import ToggleButton from 'react-bootstrap/ToggleButton';
import { TextField } from '@material-ui/core';
import { Container, Row, Col } from 'reactstrap';
import { trackPromise } from "react-promise-tracker";
import { ThemeProvider, createTheme, responsiveFontSizes } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
var theme = createTheme();
theme.typography = { 
};
const devSite = "overtime.ybstn.ru";//"localhost:5001";

export class DayForm extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            data: this.props.DayData, overtimeHourStart: "", hourMinuteRound: "", overtimeHourCost: "", holidayNightCost: "",
            holiday: false, otherPaysShow: false, place: "", fromTime: "10:00", toTime: "18:00", ovTime: "00:00", totalWorkTime:"00:00", cost: 0, otherPays:0,  mailed: false
        };
        this.PlaceTextChanged = this.PlaceTextChanged.bind(this);
        this.HolidayToggle = this.HolidayToggle.bind(this); 
        this.OtherPaysToggle = this.OtherPaysToggle.bind(this);
        this.OtherPaysChanged = this.OtherPaysChanged.bind(this);
        this.OtherPaysInp = React.createRef();
        this.FromTimeChanged = this.FromTimeChanged.bind(this);
        this.ToTimeChanged = this.ToTimeChanged.bind(this); 
        this.timeDifferenceAndSummCounter = this.timeDifferenceAndSummCounter.bind(this); 
        this.nowDate = this.props.SelectedDate;
        this.NonFormatedNowDate = this.props.NonFormatedSelectedDate;
        this.onSubmit = this.onSubmit.bind(this);
        this.loadSettingsData = this.loadSettingsData.bind(this);
        
       
        
    }
    componentDidMount() {
        this.loadSettingsData();
        if (this.state.data != null) {
            let dat = this.state.data;
            let showOtherPays = dat.otherPays === 0 ? false : true;

            this.setState({ holiday: dat.holiday, otherPaysShow: showOtherPays, place: dat.place, fromTime: dat.fromTime, toTime: dat.toTime, ovTime: dat.ovTime, cost: dat.cost, otherPays: dat.otherPays, mailed: dat.mailed });
        }
    }
    loadSettingsData() {
        let locStorageJson = JSON.parse(localStorage.getItem("currentUser"));
        let id = locStorageJson["iD"];
        let name = locStorageJson["fullName"];
        let token = locStorageJson["jwtToken"];
        var url = new URL("https://" + devSite +"/home/GetSettings");
        url.search = new URLSearchParams({ id: id, name: name });
        trackPromise(
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + token
            }
        }).then(response => response.json()).then(data => this.getSettingsInfo(data))
            )
    }
    getSettingsInfo(data) {
        this.setState({ overtimeHourStart: data.overtimeHourStart, hourMinuteRound: data.hourMinuteRound, overtimeHourCost: data.overtimeHourCost, holidayNightCost: data.holidayNightCost });
        let nowdateAsDate = new Date(this.NonFormatedNowDate);
        let dayOfWeek = nowdateAsDate.getDay();
        if ((dayOfWeek === 6 || dayOfWeek === 0) && !this.state.holiday)
        {
            this.HolidayToggle();
        }
    }
    PlaceTextChanged(e)
    {
        this.setState({ place: e.target.value });
    }

    HolidayToggle() {
        this.setState({ holiday: !this.state.holiday }, () => { this.timeDifferenceAndSummCounter(); });
    }
    OtherPaysToggle() {
        this.setState({ otherPaysShow: !this.state.otherPaysShow }, () => { this.OtherPaysInp.current.focus(); this.timeDifferenceAndSummCounter();});

    }
    OtherPaysChanged(e) {
        this.setState({ otherPays: e.target.value }, () => { this.timeDifferenceAndSummCounter(); });
    }
    FromTimeChanged(e) {
        this.setState({ fromTime: e.target.value }, () => { this.timeDifferenceAndSummCounter(); });
       
    }
    ToTimeChanged(e) {
        this.setState({ toTime: e.target.value }, () => { this.timeDifferenceAndSummCounter(); });
    }
    timeDifferenceAndSummCounter()
    {
        let from = this.state.fromTime.split(':');
        let FPhour = parseInt(from[0]);
        let to = this.state.toTime.split(':');
        let TPhour = parseInt(to[0]);
        if (TPhour === 0) {
            TPhour = 24;
        }
        else {
            if (TPhour <= FPhour) {
                TPhour = TPhour + 24;
            }
        }
        let FromTimeInt = (FPhour * 60) + parseInt(from[1]);
        let ToTimeInt = (TPhour * 60) + parseInt(to[1]);
        let TimeDiffInt = ToTimeInt - FromTimeInt;
        let hours = Math.floor(TimeDiffInt / 60);
        let minutes = TimeDiffInt - hours * 60;
        
        let WeekDayPrice = 0;
        
        if (this.state.holiday) {
            
            WeekDayPrice = parseInt(this.state.holidayNightCost);
            
        }
        let AdditionalPaymentValue = 0;
        if (this.state.otherPaysShow) {
            if (this.state.otherPays.length !== 0) {
                AdditionalPaymentValue = parseInt(this.state.otherPays);
            }
        }
        let DayCost = 0;
        let TotalOverTime = 0;
        let totalWorkTime = 0;
        let StarHour = parseInt(this.state.overtimeHourStart);
        let OneHourCost = parseInt(this.state.overtimeHourCost);
        if (hours > 8) {
            DayCost = (((hours - StarHour) * OneHourCost) + WeekDayPrice);
            TotalOverTime = (hours - StarHour).toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + ":" + minutes.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false });
            totalWorkTime = hours.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + ":" + minutes.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false });
        }
        else {
            TotalOverTime = "00:00";
            totalWorkTime = hours.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + ":" + minutes.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false });
            if (this.state.holiday) {
                DayCost = WeekDayPrice;
            }
        }
        let PreTimeCount = parseInt(this.state.hourMinuteRound);
        if (minutes > 0 && hours >= StarHour) {
            if (minutes >= PreTimeCount) {
                DayCost = (((hours + 1) - StarHour) * OneHourCost) + WeekDayPrice;
            }
            TotalOverTime = ((hours+1) - StarHour).toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + ":" + minutes.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false });
            totalWorkTime = (hours + 1).toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false }) + ":" + minutes.toLocaleString('ru-RU', { minimumIntegerDigits: 2, useGrouping: false });

        }
        this.setState({ ovTime: TotalOverTime, totalWorkTime: totalWorkTime, cost: DayCost, otherPays: AdditionalPaymentValue});
    }
    onSubmit() {
        
        let date = this.nowDate;
        let holiday = this.state.holiday;
        let place = this.state.place;
        let fromtime = this.state.fromTime;
        let totime = this.state.toTime;
        let ovtime = this.state.ovTime;
        let totalTime = this.state.totalWorkTime;
        let otherpays = this.state.otherPays;
        let cost = this.state.cost;
        this.props.onDayFormSubmit({ date: date, holiday: holiday, place: place, fromTime: fromtime, toTime: totime, ovTime: ovtime, totalTime: totalTime, cost: cost, otherPays: otherpays });
    }
    
    render() {
        return (
            <Container fluid >
                <h1 className="text-center ">{this.nowDate}</h1>
                <Row className="mb-3 " >
                    <Box px={0}>
                    <ThemeProvider theme={theme}>
                            <Typography variant="h3">
                    <TextField multiline rows={2}  value={this.state.place} onChange={this.PlaceTextChanged} placeholder="Место работы"
                                className="textinputColor w-100" />
                        </Typography>
                        </ThemeProvider>
                    </Box>
                </Row>
                <Row className="mb-3" >
                    <Col className="text-center p-0 ">
                        <ThemeProvider theme={theme}>
                            <Typography variant="h3"  >
                        <TextField
                            id="FromTime"
                            type="time"
                            className="TimePicker"
                            value={this.state.fromTime}
                            InputLabelProps={{
                                shrink: true,
                               
                            }}
                            inputProps={{
                                step: 300, // 5 min
                            }}
                            onChange={this.FromTimeChanged} 
                                />
                            </Typography>
                            </ThemeProvider>
                    </Col>
                    <Col className="text-center p-0 ">
                        <ThemeProvider theme={theme}>
                            <Typography variant="h3">
                        <TextField
                            id="ToTime"
                            type="time"
                            className="TimePicker"
                            value={this.state.toTime}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                step: 300, // 5 min
                            }}
                            onChange={this.ToTimeChanged} 
                                />
                            </Typography>
                        </ThemeProvider>
                    </Col>
                </Row>
                <Row className="mb-3 " >
                        <ToggleButton
                            id="toggle-check2"
                        type="checkbox"
                        className="TextSize"
                            variant={this.state.holiday ? "warning" : "secondary"}
                            onChange={this.HolidayToggle}
                            >
                            ВЫХОДНОЙ/НОЧНАЯ РАБОТА
                          </ToggleButton>
                </Row>
                <Row className="mb-3 " >
                        <ToggleButton
                            id="toggle-check3"
                        type="checkbox"
                        className="TextSize"
                        variant={this.state.otherPaysShow ? "warning" : "secondary"}
                        onChange={this.OtherPaysToggle}
                            >
                            ДОПОЛНИТЕЛЬНАЯ ВЫПЛАТА
                          </ToggleButton>
                </Row >
                <Row className="mb-3 TextSize" style={{ display: this.state.otherPaysShow ? 'block' : 'none' }} >
                    <Box px={0}>
                    <ThemeProvider theme={theme}>
                        <Typography variant="h3">  
                            <TextField type="number" value={this.state.otherPays === 0 ? '' : this.state.otherPays} onChange={this.OtherPaysChanged} ref={this.OtherPaysInp} className="textinputColor w-100" />
  </Typography>
                        </ThemeProvider>
                        </Box>
                </Row>
                <Row className="mb-3 text-center" >
                    <Col className="p-0 ">
                        <Form.Label className="TextSize">ВРЕМЯ:</Form.Label>
                    </Col>
                    <Col className="p-0">
                        <Form.Label className="TextSize">РУБ.:</Form.Label>
                    </Col>
                </Row>
                <Row className="mb-3 text-center" >
                    <Col className="p-0">
                        <Form.Label className="TextSize" >{this.state.ovTime}</Form.Label>
                    </Col>
                    <Col className="p-0">
                        <Form.Label className="TextSize">{this.state.cost + this.state.otherPays}р.</Form.Label>
                    </Col>
                </Row>
                <Row className="mb-3" >
                    <Col className="p-0 me-1">
                        <Button variant="secondary" className="TextSize w-100" onClick={this.props.onCloseModal}>ОТМЕНИТЬ</Button>
                    </Col>
                    <Col className="p-0 ms-1">
                        <Button variant="secondary" className="TextSize w-100" onClick={this.onSubmit}>СОХРАНИТЬ</Button>
                    </Col>
                </Row>
            </Container>
        );
    }

}