import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function CreateBlogModal({ isOpen, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);

  if (!isOpen) return null;
  const handleSubmit = (
    e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) => {
    e.preventDefault();
    console.log({
      title,
      content,
      image,
    });
    setTitle("");
    setContent("");
    setImage(null);
    onClose();
  };
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Create Blog</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            rows={8}
            placeholder="Write your blog"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
          <div>
            <button type="submit">Publish</button>
            <button type="button" onClick={onClose}>
              {" "}
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBlogModal;
