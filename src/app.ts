import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import axios from "axios";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/webhooks/sendblue", async (req, res) => {
  console.log("Received webhook from Sendblue");
  const { content, from_number, message_handle, is_outbound, status } =
    req.body;
  console.log("Request body:", req.body);

  try {
    const message = await axios.post(
      "https://api.sendblue.co/api/send-message",
      {
        content: "Hi there",
        from_number: "+1 (402)-613-7710",
        number: from_number,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "sb-api-key-id": process.env.SENDBLUE_API_API_KEY!,
          "sb-api-secret-key": process.env.SENDBLUE_API_API_SECRET!,
        },
      }
    );

    console.log("Message sent successfully:", message.data);
  } catch (error: any) {
    console.error("Error sending message:");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Error Data:", error.response?.data);
    console.error("Request Data:", {
      content: "Hi there",
      from_number: "+14026137710",
      to_number: from_number,
    });
    console.error("Headers:", {
      "sb-api-key-id": process.env.SENDBLUE_API_API_KEY ? "SET" : "MISSING",
      "sb-api-secret-key": process.env.SENDBLUE_API_API_SECRET
        ? "SET"
        : "MISSING",
    });
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
