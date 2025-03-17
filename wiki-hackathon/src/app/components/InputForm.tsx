'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

// Predefined categories for users to select from
const PREDEFINED_CATEGORIES = [
  'Science', 'Technology', 'History', 'Geography', 'Arts',
  'Philosophy', 'Sports', 'Music', 'Literature', 'Politics',
  'Economics', 'Mathematics', 'Biology', 'Physics', 'Chemistry',
  'Computer Science', 'Medicine', 'Architecture', 'Psychology', 'Sociology'
];

interface InputFormProps {
  onSubmit: (data: { topics: string[]; text: string }) => void;
  isLoading?: boolean;
}

export default function InputForm({ onSubmit, isLoading = false }: InputFormProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [activeTab, setActiveTab] = useState<'topics' | 'text' | 'file'>('topics');

  // Configure dropzone for resume uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        const content = reader.result as string;
        setFileContent(content);
      };
      
      reader.readAsText(file);
    }
  });

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic) 
        : [...prev, topic]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine all input sources based on active tab
    let combinedText = '';
    let topics: string[] = [];
    
    if (activeTab === 'topics') {
      topics = selectedTopics;
    } else if (activeTab === 'text') {
      combinedText = freeText;
    } else if (activeTab === 'file') {
      combinedText = fileContent;
    }
    
    onSubmit({ 
      topics, 
      text: combinedText 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-8">
      <h2 className="text-xl font-semibold mb-6">Share Your Expertise</h2>
      
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        <button 
          type="button"
          onClick={() => setActiveTab('topics')}
          className={`px-4 py-2 ${activeTab === 'topics' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Select Topics
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 ${activeTab === 'text' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Free Text
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2 ${activeTab === 'file' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Upload Resume
        </button>
      </div>
      
      {/* Topic Selection */}
      {activeTab === 'topics' && (
        <div className="mb-6">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            Select topics that match your expertise:
          </p>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_CATEGORIES.map(topic => (
              <button
                key={topic}
                type="button"
                onClick={() => handleTopicToggle(topic)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTopics.includes(topic)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Free Text Input */}
      {activeTab === 'text' && (
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">
            Describe your expertise in your own words:
          </label>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            className="w-full h-32 p-2 border rounded-md bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            placeholder="I'm knowledgeable about quantum computing, specifically in the areas of..."
          />
        </div>
      )}
      
      {/* File Upload */}
      {activeTab === 'file' && (
        <div className="mb-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed p-8 rounded-md text-center cursor-pointer transition
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-700'
              }
              ${fileContent ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {fileContent ? (
              <div className="text-green-600 dark:text-green-400">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p>Resume uploaded successfully!</p>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFileContent('');
                  }}
                  className="mt-2 text-sm underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop your resume, or click to select a file
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  Supported formats: TXT, PDF, DOC, DOCX
                </p>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isLoading || (
            activeTab === 'topics' ? selectedTopics.length === 0 :
            activeTab === 'text' ? !freeText.trim() :
            !fileContent
          )}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : 'Find Articles to Contribute To'}
        </button>
      </div>
    </form>
  );
} 