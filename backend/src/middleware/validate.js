/**
 * Renvoie une 400 formatée si express-validator a des erreurs.
 * Usage : router.post('/', [ ...checks ], validate, controller)
 */
const { validationResult } = require('express-validator');

module.exports = function validate(req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
};
