import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://18.234.69.130:32000"; // Change if backend is hosted elsewhere

function App() {
  const [notes, setNotes] = useState([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({}); // Store analysis per note

  // Fetch notes
  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/notes`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Prepare analysis prompt
  const buildAnalysisPrompt = (text) => {
    return `
You are an expert code and text reviewer.
Analyze the following note or code strictly in a **point-wise** format.

Requirements:
1. Highlight key ideas or functionality.
2. Detect and explain any errors or issues (syntax, logic, clarity).
3. Suggest improvements or best practices.
4. Avoid any irrelevant or unrelated information.
5. Keep the tone professional and concise.

Here is the content to analyze:
---
${text}
---`;
  };

  const handleInvokeSonnet = async (noteName, text) => {
    try {
      const prompt = buildAnalysisPrompt(text);
      const res = await axios.post(`${API_URL}/invoke`, {
        inputText: prompt
      });

      setAnalysisResults((prev) => ({
        ...prev,
        [noteName]: res.data.result
      }));
    } catch (err) {
      console.error(err);
      setAnalysisResults((prev) => ({
        ...prev,
        [noteName]: "❌ Error invoking model"
      }));
    }
  };

  // Create or update note
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await axios.put(`${API_URL}/notes/${editingNote}`, { content });
        setEditingNote(null);
      } else {
        await axios.post(`${API_URL}/notes`, { name, content });
      }
      setName("");
      setContent("");
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  // Edit note
  const handleEdit = (note) => {
    setEditingNote(note.name);
    setName(note.name);
    setContent(note.content);
  };

  // Delete note
  const handleDelete = async (noteName) => {
    try {
      await axios.delete(`${API_URL}/notes/${noteName}`);
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "auto", padding: "1rem" }}>
      <h1>📒 Notes App + Claude Sonnet Analyzer</h1>

      {/* Note Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        {!editingNote && (
          <input
            type="text"
            placeholder="Note name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
        )}
        <textarea
          placeholder="Note content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          style={{ width: "100%", height: "100px", marginBottom: "0.5rem" }}
        />
        <button type="submit">
          {editingNote ? "Update Note" : "Add Note"}
        </button>
        {editingNote && (
          <button
            type="button"
            onClick={() => {
              setEditingNote(null);
              setName("");
              setContent("");
            }}
            style={{ marginLeft: "0.5rem" }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Notes List */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {notes.map((note) => (
          <li
            key={note.name}
            style={{
              border: "1px solid #ccc",
              padding: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <h3>{note.name}</h3>
            <p>{note.content}</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => handleInvokeSonnet(note.name, note.content)}>
                Analyze
              </button>
              <button
                onClick={() => handleInvokeSonnet(note.name, note.content)}
                disabled={!analysisResults[note.name]}
              >
                🔄 Reload Analysis
              </button>
            </div>

            {/* Analysis Result */}
            {analysisResults[note.name] && (
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  background: "#f9f9f9",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  whiteSpace: "pre-wrap"
                }}
              >
                <strong>Analysis:</strong>
                <p>
                  {typeof analysisResults[note.name] === "string"
                    ? analysisResults[note.name]
                    : JSON.stringify(analysisResults[note.name], null, 2)}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
