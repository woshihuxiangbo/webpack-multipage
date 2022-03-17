const path = require("path");
const fs = require("fs");
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerWebpackPlugin = require("css-minimizer-webpack-plugin");
const PurgecssPlugin = require("purgecss-webpack-plugin");
const WebpackBar = require("webpackbar");
const PATHS = {
  src: path.join(__dirname, "src"),
};
//  获取js -----------------------------------------------
const files = fs.readdirSync("./src/js");
const fileNames = files.map((item) => path.basename(item, ".js"));
const entry = {};
fileNames.forEach((item) => {
  entry[item] = `./src/js/${item}.js`;
});
//  获取html -----------------------------------------------
const HtmlWebpacks = fileNames.map(
  (item) =>
    new HtmlWebpackPlugin({
      template: `./src/page/${item}.art`,
      filename: `${item}.html`,
      chunks: [item],
    })
);
// 插件----------------------------------------------------
const plugins = [
  new CssMinimizerWebpackPlugin(), // 压缩css
  new CleanWebpackPlugin(), // 打包钱clear dist
  new WebpackBar({
    name: "多页应用",
    color: "#FF1493",
    reporter:{
      done() {
        if(process.env.NODE_ENV === "production"){
          console.log('\x1b[91m','┌─┬─┬─┬─┬─┬───┐')
          console.log('\x1b[91m','│  打 包 成 功 ')
          console.log('\x1b[91m','└──┴──┴──┴────┘')
        }else{
          console.log('\x1B[32m','┌─┬─┬─┬─┬─┬───┐')
          console.log('\x1B[32m','│  开 发 模 式  ')
          console.log('\x1B[32m','└──┴──┴──┴────┘')
        }

      },
    }
  }), // 打包进度
  new MiniCssExtractPlugin({
    filename: "css/" + "[name].[chunkhash:5].css",
  }),
  ...HtmlWebpacks,
];
if (process.env.NODE_ENV === "production") {
  plugins.push(
    new PurgecssPlugin({
      paths: glob.sync(`${PATHS.src}/**/*`, { nodir: true }), // 去除无用css
    })
  );
}
module.exports = {
  entry,
  output: {
    filename: "js/" + "[name].[chunkhash:5].js",
    path: path.resolve(__dirname, "./dist"),
  },
  devServer: {
    hot: true,
    open: true,
    static: "./src",
  },
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "autoprefixer", // css加浏览器前缀
                  ],
                ],
              },
            },
          },
          "less-loader",
        ],
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif)$/,
        type: 'asset',//webpack5 用asset处理图片    // 实现判断图片大小转化base64
        parser: {
          dataUrlCondition: { // 判断图片是否转化为base64
            maxSize: 8 * 1024 // 8kb
          }
        },
        generator: {
          filename: 'imgs/'+'[hash:5][ext][query]'  // 文件输出路径及命名
        } 
      },    
      {
        test: /\.(htm|html)$/i,
        loader: "html-withimg-loader", // 处理html图片引用 配合file-laoder一起使用
      },
      {
        test: /\.(js|less|css)$/,
        include: path.resolve("src"),
        use: [
          "thread-loader", // 多进程构建
        ],
      },
      {
        test: /\.art$/,
        loader: "art-template-loader",
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    },
    minimize: process.env.NODE_ENV === "production" ? true : false, // dev模式不进行压缩,页面自动刷新快些
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  plugins,
  resolve: { preferRelative: true },
  stats: "errors-warnings", // 当打包有错误时候控制台输出信息
};
//  看 https://www.cnblogs.com/axl234/p/15883058.html
//  多页打包
//  js babel
//  less + 添加浏览器前缀 + 压缩css
//  去除多余js 和 css
//  使用art-template模版
//  多进程构建
