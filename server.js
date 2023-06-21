import { Configuration, OpenAIApi } from "openai";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";



const configuration  = new Configuration({
    organization: "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",
    apiKey: "org-42tkOjCP0zqoLPbn8xpQdjLo",
});

const openai = new OpenAIApi(configuration);

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());


app.post("/", async (req,  res) => {

    const { messages } = req.body;

    console.log("Received messages:", messages);
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {"role": "system", "content": "You are Mocktalk, a mock interviewer bot for a Software Engineering role. Ask only one question at a time. You have a limit of 4 questions to ask"},
            ...messages
            //{role: "user", content: `${message}`},
        ]
    })

    console.log("Completion: ", completion.data.choices[0].message);
    res.json({
        completion: completion.data.choices[0].message
    })
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});