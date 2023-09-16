import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default async function getLanguageViaRecognition(content: string) {
  try {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI}`,
      },
      body: JSON.stringify({
        providers: "amazon",
        text: content,
      }),
    };

    if (!content) return null;

    const aiResponse = await fetch(
      "https://api.edenai.run/v2/translation/language_detection",
      options
    );

    const data = await aiResponse.json();

    const languages = data?.amazon?.items
      .map((langData: { display_name: string }) => langData.display_name)
      .join(", ")
      .toUpperCase();

    return languages;
  } catch (error) {
    return null;
  }
}
