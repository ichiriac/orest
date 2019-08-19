(function($) {
    sakila.ui.login = function($app, api, cb) {
        var username, password, form, remember, error;

        // login ui
        $app.empty().append(
            $('<div class="card card-container">').append([
                $('<img id="profile-img" class="profile-img-card" src="//ssl.gstatic.com/accounts/ui/avatar_2x.png" />'),
                $('<p id="profile-name" class="profile-name-card">'),
                form = $('<form class="form-signin">').append([
                    error = $('<span id="reauth-email" class="reauth-email"></span>'),
                    username = $('<input type="text" class="form-control" placeholder="Username" required autofocus>'),
                    password = $('<input type="password" class="form-control" placeholder="Password" required>'),
                    $('<div id="remember" class="checkbox">').append(
                        $('<label>').append([
                            remember = $('<input type="checkbox" value="remember-me">'),
                            'Remember me'
                        ])
                    ),
                    $('<button class="btn btn-lg btn-primary btn-block btn-signin" type="submit">').text(
                        'Sign in'
                    )
                ])
            ])
        );

        // handle the login phase
        form.on('submit', function(e) {
            e.preventDefault();
            error.empty();
            api.login(username.val(), password.val()).then(function(tok) {
                if (remember.is(':checked')) {
                    // @todo
                }
                cb();
            }).catch(function(e) {
                console.error(e);
                error.text(e.message);
            });
            return false;
        })
    };
})(jQuery);
