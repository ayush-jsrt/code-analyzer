import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://18.234.69.130:32000"; // Change if backend is hosted elsewhere

function App() {
  const [notes, setNotes] = useState([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [sonnetInput, setSonnetInput] = useState("");
  const [sonnetOutput, setSonnetOutput] = useState("");
  const [lastAnalyzedText, setLastAnalyzedText] = useState("");

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

  const handleInvokeSonnet = async (text) => {
    try {
      const prompt = buildAnalysisPrompt(text);
      const res = await axios.post(`${API_URL}/invoke`, {
        inputText: prompt
      });
      setSonnetOutput(res.data.result);
      setLastAnalyzedText(text);
    } catch (err) {
      console.error(err);
      setSonnetOutput("❌ Error invoking model");
    }
  };

  // Reload the last analysis
  const handleReloadAnalysis = () => {
    if (lastAnalyzedText) {
      handleInvokeSonnet(lastAnalyzedText);
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

      {/* Sonnet Analyzer */}
      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ccc" }}>
        <h2>🤖 Claude Sonnet 4 — Note/Code Analyzer</h2>
        <textarea
          placeholder="Paste your note or code here for analysis..."
          value={sonnetInput}
          onChange={(e) => setSonnetInput(e.target.value)}
          style={{ width: "100%", height: "100px", marginBottom: "0.5rem" }}
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => handleInvokeSonnet(sonnetInput)}>Analyze</button>
          <button onClick={handleReloadAnalysis} disabled={!lastAnalyzedText}>
            🔄 Reload Analysis
          </button>
        </div>

        {sonnetOutput && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: "#f9f9f9",
              border: "1px solid #ddd",
              borderRadius: "5px",
              whiteSpace: "pre-wrap"
            }}
          >
            <strong>Analysis:</strong>
            <p>{typeof sonnetOutput === "string" ? sonnetOutput : JSON.stringify(sonnetOutput, null, 2)}</p>
          </div>
        )}
      </div>

      {/* Notes List */}
      <ul style={{ listStyle: "none", padding: 0, marginTop: "2rem" }}>
        {notes.map((note) => (
          <li
            key={note.name}
            style={{
              border: "1px solid #ccc",
              padding: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <h3>{note.name}</h3>
            <p>{note.content}</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => handleEdit(note)}>Edit</button>
              <button onClick={() => handleDelete(note.name)}>Delete</button>
              <button onClick={() => handleInvokeSonnet(note.content)}>Analyze</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
