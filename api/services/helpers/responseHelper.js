exports.error = (res, status, message) => {
    if (!status) {
        status = 500;
    }
    if (!message) {
        message = 'An Unknown Error Has Occurred.';
    }
    res.status(status).json({message});
};
exports.success = (res, status, body) => {
    res.status(status).json(body);
};