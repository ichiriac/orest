const crypto = require('crypto');

module.exports = function(api, db) {
    const model = db.model('Staff');

    // performs a login
    api.endpoint('/auth').post(function(req, res) {
        // check parameters
        if (!req.body.username) {
            throw new api.error.BadArgument(
                'Missing username'
            )
        }
        if (!req.body.password) {
            throw new api.error.BadArgument(
                'Missing password'
            );
        }
        // search for the user
        model.findOne({
            where: {
                username: req.body.username
            }
        }).then(function(user) {
            if (!user) {
                throw new api.error.NotFound(
                    'Bad username'
                );
            }
            const password = crypto.createHash('sha1').update(req.body.password).digest("hex");
            if (user.password !== password) {
                throw new api.error.Unauthorized(
                    'Bad username/password'
                );
            }
            api.token({ id: user.staff_id }, req, res);
        }).catch((err) => {
            api.respond(req, res, err);
        });
    })
        .describe('Opens a session')
        .param('username', 'string', 'The username to login', true)
        .param('password', 'string', 'The user password', true)
    ;

    // destroys a session
    api.endpoint('/logout').auth().post((req, res) => {
        return req.jwt.destroy();
    }).describe('Closes the current token');

    // retrieves personnal informations
    api.endpoint('/me').auth().get((req, res) => {
        const userId = req.jwt.id;
        return model.findByPk(userId, { password: 0 });
    }).describe('Show profile informations');

};