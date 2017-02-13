var config = {
    'dbhost': '127.0.0.1',
    'dbport': 27017,
    'dbname': 'webdocs'
}

exports.get = function(configName) {
    return config[configName];
}
