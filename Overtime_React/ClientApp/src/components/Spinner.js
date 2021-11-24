import React from "react";
import { usePromiseTracker } from "react-promise-tracker";
import { Loader } from "react-loader-spinner";
import { trackPromise } from "react-promise-tracker";
import Spinner from 'react-bootstrap/Spinner'
export const LoadingSpinner = (props) => {
    const { promiseInProgress } = usePromiseTracker({ delay: 500 });
    return (
        promiseInProgress && (
            <div className="spinner">
                <Spinner animation="border" variant="secondary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <div className="spinnerText">ЗАГРУЗКА</div>
            </div>
        )
    );
};