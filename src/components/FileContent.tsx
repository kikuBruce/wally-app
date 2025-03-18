import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import * as cjs from "react-syntax-highlighter/dist/cjs/styles/prism"


const FileContent: React.FC<{ content: string; language?: string }> = ({
  content,
  language = "python",
}) => {
  return (
    <SyntaxHighlighter language={language} style={cjs.vs} showLineNumbers customStyle={{
      fontFamily: "'Consolas'",
      fontSize: "14px",
      margin: '0px'
    }}>
      {content}
    </SyntaxHighlighter >
  );
};

export default FileContent
