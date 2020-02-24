(function($) {
    sakila.ui.main = function($app, api) {
        $app.empty();
        $app.append(
            $('<div class="card card-container">').append([
                $('<button class="btn btn-danger">').text('logout').on('click', function() {
                    // request to logout
                    api.logout().then(function() {
                        sakila.ui.login($app, api, function() {
                            sakila.ui.main($app, api);
                        });
                    }).catch(function(e) {
                        alert(e.message);
                    })
                })
            ])
        );
    };
})(jQuery);