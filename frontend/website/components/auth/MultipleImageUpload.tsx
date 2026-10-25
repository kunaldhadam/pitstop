import React, { useEffect, useState } from "react";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

interface MultipleImageUploadProps {
  value: File[];
  onChange: (files: File[]) => void;
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  value,
  onChange,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    const newImages: ImageItem[] = value.map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(newImages);

    return () => {
      newImages.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, [value]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      event.target.value = "";
      return;
    }

    onChange([...value, ...imageFiles]);

    // Allow selecting the same file again
    event.target.value = "";
  };

  const removeImage = (id: string) => {
    const imageToRemove = images.find((image) => image.id === id);

    if (!imageToRemove) {
      return;
    }

    const updatedFiles = value.filter(
      (file) =>
        !(
          file.name === imageToRemove.file.name &&
          file.lastModified === imageToRemove.file.lastModified &&
          file.size === imageToRemove.file.size
        ),
    );

    onChange(updatedFiles);
  };

  return (
    <div className="garage-image">
      <h4>Add Garage Photos</h4>

      <div className="image-upload">
        <div className="image-grid">
          {images.map((image) => (
            <div className="image-preview" key={image.id}>
              <img src={image.preview} alt={image.file.name} />

              <button
                type="button"
                className="remove-image"
                onClick={() => removeImage(image.id)}
                aria-label={`Remove ${image.file.name}`}
              >
                ×
              </button>
            </div>
          ))}

          <label className="add-image">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />

            <span>+</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default MultipleImageUpload;
