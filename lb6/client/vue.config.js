module.exports = {
    devServer: {
        proxy: {
            '/broker': {
                target: 'http://localhost:8000',
            },
        },
    },
};
