module.exports = (statusCode, message) => {
    let e = new Error(message);
    e.statusCode = statusCode;

    return e;
}
