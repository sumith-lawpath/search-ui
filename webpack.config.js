const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

const mainProperties = {
  entry: {
    search: "./src/index.js",
  },
  output: {
    path: path.join(__dirname, "/build"),
    filename: "[name].bundle.js",
  },
};

const rules = {
  rules: [
    {
      test: /\.js|\.jsx$/,
      exclude: /node_modules/,
      use: "babel-loader",
    },
    {
      test: /\.scss$/,
      exclude: /node_modules/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
            modules: true
          }
        },
        'sass-loader'
      ]
    },
    {
      test: /\.(png|jp(e*)g)$/i,
      use: [
        {
          loader: "url-loader",
          options: {
            limit: 8000,
            name: "images/[name]-[hash].[ext]",
          },
        },
      ],
    },
    {
      test: /\.(svg)$/,
      use: [
        "@svgr/webpack",
        {
          loader: "url-loader",
          options: {
            limit: 8000,
            name: "images/[name]-[hash].[ext]",
          },
        },
      ],
    },
  ],
};

const plugins = [
  new HTMLWebpackPlugin({
    template: "./src/index.html",
  }),
];

module.exports = {
  ...mainProperties,
  module: rules,
  plugins: plugins,
};
