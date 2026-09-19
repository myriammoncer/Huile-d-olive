/**
 * Wrapper pour controllers async → les erreurs remontent au error handler global.
 * Évite d'écrire try/catch dans chaque controller.
 */
module.exports = function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
