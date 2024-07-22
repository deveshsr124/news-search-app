const express = require('express');
const axios = require('axios');
const cors = require('cors');
// const { Configuration, OpenAIApi } = require('openai');
const OpenAIApi = require('openai')
require('dotenv').config();
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// // Configure OpenAI API
const openai = new OpenAIApi({
  apiKey: process.env.OPEN_AI_API_KEY,
});

// Fetch news articles from a third-party news API
app.get('/search', async (req, res) => {
  const keyword = req.query.q;
  console.log('key word',req.query)
  try {
    const newsResponse = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: keyword,
        apiKey:process.env.NEWS_API_KEY,
      },
    });

    const articles = newsResponse.data.articles;
    
    // Summarize each article using OpenAI API
    const summarizedArticles = await Promise.all(articles.map(async (article) => {
      const summary = await getSummary(article.content);
      return {
        title: article.title,
        source: article.source.name,
        publishedAt: article.publishedAt,
        summary,
      };
    }));

    res.json({ articles: articles });
  } catch (error) {
    console.error('Error fetching news articles', error);
    res.status(500).json({ error: 'Failed to fetch news articles' });
  }
});

// Function to get summary using OpenAI API
const getSummary = async (content) => {
  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: content }],
      model: 'gpt-3.5-turbo',
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating summary', error);
    return 'Summary not available';
  }
};

// Serve the frontend (React app)
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
