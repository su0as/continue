import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Search, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';

interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  expanded?: boolean;
  selected?: boolean;
}

interface FileDropdownProps {
  onFilesSelected: (files: string[]) => void;
  onClose: () => void;
  allowMultiple?: boolean;
  fileFilter?: string[];
  initialPath?: string;
}

export const FileDropdown: React.FC<FileDropdownProps> = ({
  onFilesSelected,
  onClose,
  allowMultiple = true,
  fileFilter = [],
  initialPath = ''
}) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

  const dispatch = useAppDispatch();
  const workspacePath = useAppSelector(state => state.config.workspacePath);

  // Fetch file tree from IDE
  useEffect(() => {
    const fetchFileTree = async () => {
      setLoading(true);
      try {
        // Request file tree from IDE
        const response = await window.ide.listWorkspaceContents(workspacePath || '.');
        setFileTree(buildFileTree(response));
      } catch (error) {
        console.error('Error fetching file tree:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFileTree();
  }, [workspacePath]);

  // Build hierarchical file tree from flat list
  const buildFileTree = (files: string[]): FileNode[] => {
    const root: { [key: string]: FileNode } = {};
    
    files.forEach(filePath => {
      const parts = filePath.split('/');
      let current = root;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            path: parts.slice(0, index + 1).join('/'),
            name: part,
            type: index === parts.length - 1 ? 'file' : 'folder',
            children: index === parts.length - 1 ? undefined : {}
          };
        }
        
        if (index < parts.length - 1) {
          if (!current[part].children) {
            current[part].children = {};
          }
          current = current[part].children as any;
        }
      });
    });

    return Object.values(root);
  };

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Toggle file selection
  const toggleFileSelection = (path: string) => {
    if (!allowMultiple) {
      setSelectedFiles(new Set([path]));
    } else {
      setSelectedFiles(prev => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    }
  };

  // Filter files based on search query
  const filterNodes = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    
    return nodes.reduce((acc: FileNode[], node) => {
      const matches = node.name.toLowerCase().includes(query.toLowerCase());
      
      if (node.type === 'folder' && node.children) {
        const filteredChildren = filterNodes(node.children, query);
        if (filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
            expanded: true
          });
        }
      } else if (matches) {
        acc.push(node);
      }
      
      return acc;
    }, []);
  };

  // Render file tree node
  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFiles.has(node.path);
    
    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              toggleFileSelection(node.path);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Folder size={16} className="text-yellow-600" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File size={16} className="text-gray-600" />
            </>
          )}
          <span className="flex-1 text-sm">{node.name}</span>
          {node.type === 'file' && isSelected && (
            <Check size={16} className="text-blue-600" />
          )}
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTree = filterNodes(fileTree, searchQuery);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[600px] max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3">Select Files for Documentation</h3>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Recent files section */}
        {recentFiles.length > 0 && !searchQuery && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recent Files</h4>
            <div className="space-y-1">
              {recentFiles.map(file => (
                <div
                  key={file}
                  className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded ${
                    selectedFiles.has(file) ? 'bg-blue-50 dark:bg-blue-900' : ''
                  }`}
                  onClick={() => toggleFileSelection(file)}
                >
                  <File size={14} className="text-gray-600" />
                  <span className="text-sm truncate">{file}</span>
                  {selectedFiles.has(file) && <Check size={14} className="text-blue-600 ml-auto" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File tree */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading files...</div>
            </div>
          ) : filteredTree.length > 0 ? (
            <div className="space-y-1">
              {filteredTree.map(node => renderNode(node))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">No files found</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex gap-2">
            <button
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={selectedFiles.size === 0}
              onClick={() => {
                onFilesSelected(Array.from(selectedFiles));
                onClose();
              }}
            >
              Generate Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
