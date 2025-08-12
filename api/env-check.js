// Returns only a boolean — safe to expose
module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    hasKey: Boolean(process.env.OPENAI_API_KEY)
  });
};
