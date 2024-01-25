import express from "express";
import { ListBucketsCommand, S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
const router = express.Router();
const client = new S3Client({region: eu-west-1});

// GET 
//Expres ルーター動作確認
//localhost:3000/storage => respond with a respurce
router.get("/", async function (req, res, next) {
  res.send("respond with a respurce");
});

// GET /storage/bucket
//バケット名リストを返す
router.get("/buckets", async function (req, res, next) {
  //S3操作のコード　ListBuckets.jsから引用して使う
  const command = new ListBucketsCommand({});
//try直後は引用そのまま
  try {
    const { Owner, Buckets } = await client.send(command);
    console.log(
      `${Owner.DisplayName} owns ${Buckets.length} bucket${
        Buckets.length === 1 ? "" : "s"
      }:`,
    );
    //console.logに・バケット名（リターン）でリスト表示させるため
    //map((b) => ${b.Name})で配列のすべての要素に対して呼び出し、b.NameでName要素だけ
    //ログに書き出す
    console.log(`${Buckets.map((b) => ` • ${b.Name}`).join("\n")}`);
    //ブラウザーにバケット名を返送するためBecketsからbucket.nameを抽出して
    //bucketNameListに格納し、JSON・文字列指定でsendする
    //map(bucket => bucket.Name)logへの書き出しとは少し違う（この違いが？？）
    let bucketNameList = Buckets.map(bucket => bucket.Name)
    res.send(JSON.stringify(bucketNameList));
    //以降はエラー処理
  } catch (err) {
    console.error(err);
    res.send(`ERROR: ${err}`);
  }
});

//GET /storage/<bucket>/files
//指定バケット配下のファイルリストを返す
router.get("/:bucket/files", async function (req, res, next) {
  const bucketName = req.params.bucket//事前にreqから:bucketを取得して変数格納
  const command = new ListObjectsV2Command({
    Bucket: bucketName,//ここで対象バケット名を変数割り当て
    // The default and maximum number of keys returned is 1000. This limits it to
    // one for demonstration purposes.
    MaxKeys: 1,//よくわからんがテンプレのまま・・・
  });

  try {
    let isTruncated = true;

    console.log("Your bucket contains the following objects:\n");
    let contents = "file list: <ul>";//filelist:の文字に引き続きulタグ（順序なしリスト要素）を書き込む

    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } =
        await client.send(command);
      //contentsLisでliタグを追加した行要素を作成してcontentsに追加する
      //</li>はないけど、ブラウザがなんとかしてくれている？
      //joinの後の</br> => </li>に変更してみてもデバッガの変数上では変化なし
      const contentsList = Contents.map((c) => `<li> ${c.Key}`).join("</br>");
      contents += contentsList + "</br>";//"\n"から"</br>"に変更（html対応？）
      //結局　行末尾の</br>はcontentsへ追加する時のが有効なの？
      isTruncated = IsTruncated;
      command.input.ContinuationToken = NextContinuationToken;
    }
    contents += "</ul>"//追加されている　最後に/ulタグ書き込みでリストが完成
    console.log(contents);
    res.send(contents);
  } catch (err) {
    console.error(err);
    res.send(`ERROR: ${err}`);
  }
});


//GET /storage/<bucket>/file/<filename>
//指定バケット名、ファイル名のファイルを返す
router.get("/:bucket/files/:filename", async function (req, res, next) {
  const bucketName = req.params.bucket;
  const fileName = req.params.filename;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
  
    try {
      const response = await client.send(command);
      //console.log(response);
      console.log(response.Body);
      // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
      const str = await response.Body.transformToString();
      console.log(str);
      res.send(str);
    } catch (err) {
      console.error(err);
      res.send(`ERROR: ${err}`);
    }
  });

export { router as default };
