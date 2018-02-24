const path = require('path');
const webpack = require('webpack'); //to access built-in plugins
const html = require('html-webpack-plugin');
const cleanup = require('clean-webpack-plugin');
const cpy = require('copy-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const outputFolder = 'production'

module.exports = {
    entry:{
        nes:'./src/entry/nes/__test__/index.jsx',
        gui:'./src/entry/gui/__test__/index.jsx'
    },
    output:{
        path:path.resolve(__dirname,    outputFolder),
        filename:'[name].[hash].js'
    },
    module: {

        rules: [
        {
            test    : /\.jsx?$/,
            exclude : /node_modules/,
            loader  : 'babel-loader',
            query   : {
                 presets: ['react','es2015'] 
            }
        }, 
        {
            test   : /\.json$/,
            loader : 'json-loader'
        },
        {
            test: /\.svg/,
                use: {
                    loader: 'svg-url-loader'
                }
        },
        {
            test: /\.less$/,
            use: [{
                loader: "style-loader"
            }, {
                loader: "css-loader"
            }, {
                loader: "less-loader"
            }]
        }
        ]
        
    },
    plugins:[
    new cleanup([outputFolder],{
        verbose:  true,
        dry:      false
    }),
    new cpy([{
        from: './assets',
        to: './assets',
        toType: 'dir'
    }]),

    new html({
        inject: true,
        title:'GUI',
        template:'src/index.ejs',
        filename:'gui.html',
        chunks:["gui"]
    }),
    new html({
        inject: true,
        title:'NES',
        template:'src/index.ejs',
        filename:'nes.html',
        chunks:["nes"]
    })
    ]
    
}