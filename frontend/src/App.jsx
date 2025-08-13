import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://54.83.177.66:31463"; // Change if backend is hosted elsewhere

function App() {
  const [notes, setNotes] = useState([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState(null);

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
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem" }}>
      <h1>📒 Notes App</h1>

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
          style={{ width: "100%", marginBottom: "0.5rem" }}
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

      <ul style={{ listStyle: "none", padding: 0 }}>
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
            <button onClick={() => handleEdit(note)}>Edit</button>
            <button
              onClick={() => handleDelete(note.name)}
              style={{ marginLeft: "0.5rem" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
