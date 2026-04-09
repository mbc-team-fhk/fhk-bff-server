export function ok(res, result = null, message = "OK") {
    return res.json({
        isSuccess: true,
        resCode: 200,
        resMessage: message,
        result,
    });
}