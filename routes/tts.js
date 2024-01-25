import { PollyClient,StartSpeechSynthesisTaskCommand} from "@aws-sdk/client-polly";
import express from "express";

const router = express.Router();
const pollyClient = new PollyClient();
//これは使っていないような・・・paramsのOutputS3BucketNameに入れるはずだったのでは？
const bucketName = "km-sd10-202401";

//GET /
//Express ルーター動作確認用
router.get("/", async function (req,res,next) {
    res.send("Express route");
});

//Polly postでテキスト取得してAWSへ転送してURLを取得する。
router.post("/save-to-s3", async function (req,res,next){
    //デバッグ用に追加 => { text: '今日は寒くなりそうですね' } 送信JSONのまま
    console.log(req.body);
    //BodyからのTextを取得する・・・textはbodyのtextプロパティのことでtextデータではない
    let text = req.body.text;
    //ここはaws-sdkまんまコピペ
    let params = {
        OutputFormat: "mp3",
        OutputS3BucketName: "km-sd10-202401",
        Text: text,
        TextType: "text",
        VoiceId: "Mizuki",
        SampleRate: "24000",
    };

    try {
        //下３行もaws-sdkのコピペ
        const result = await pollyClient.send(new StartSpeechSynthesisTaskCommand(params));
        console.log("Success, audio file added to " + params.OutputS3BucketName);
        console.log(result)
        //ここのSynthesisTask.OutputUri（保存先URL）はひとつ前のconsole.logの内容から推測する
        res.send(result.SynthesisTask.OutputUri)
      } catch (err) {
        console.log("Error putting object", err);
        res.send(`ERROR: ${err}`);
      };
});

export { router as default };

//ミスポイント　
//１）app.jsのroute設定ができていなかった。
//import ttsRouter from "./routes/tts.js";
//app.use("/tts",ttsRouter);
//２）Pollyの頭の大文字などの間違いが多々あった・・・
//３）ルートを/ttsにしなければいけないことに気づかなかった
//既存のSDK流用部分と変更・追記部分を考えるのが難しい・・・
