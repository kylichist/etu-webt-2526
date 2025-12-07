import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';

export default {
    entry: {
        app: './public/js/main.js',
        styles: './public/styles/main.scss'
    },
    output: {
        path: path.resolve(process.cwd(), 'build_webpack'),
        filename: 'js/[name].bundle.js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    plugins: [new MiniCssExtractPlugin({ filename: 'css/[name].css' })],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()]
    },
    mode: 'production'
};
