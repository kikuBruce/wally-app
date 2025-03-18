import React, { useEffect, useState } from "react";
import { Flex, Splitter, Tag, Tree } from "antd";
import type { SplitterProps } from "antd";
import FileTree from "./components/FileTree";
import FileContent from "./components/FileContent";
import { DataNode } from "antd/es/tree";
import { PythonOutlined } from "@ant-design/icons";

const convertToTreeData = (tasks: Record<string, string[]>): DataNode[] => {
  return Object.entries(tasks).map(([taskName, files]) => ({
    title: taskName,
    key: taskName,
    children: files.map((filePath) => ({
      title: filePath.split("/").pop(),
      key: `${taskName}.${filePath}`,
      icon: <PythonOutlined />
    }))
  }));
};


const CustomSplitter: React.FC<Readonly<SplitterProps>> = ({
  style,
  ...restProps
}) => {
  const [fileContent, setFileContent] = useState<string>("");
  const [treeData, setTreeData] = useState<DataNode[]>([]);

  const fetchData = async () => {
    const tasks = await window.electronAPI.taskStoreList()
    console.log(`taskList: ${tasks}`)
    if (tasks) {
      const treeData = convertToTreeData(tasks)
      setTreeData(treeData)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <Splitter
      style={{ boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)", ...style }}
      {...restProps}
    >
      <Splitter.Panel collapsible min="20%" defaultSize="25%">
        <Splitter layout="vertical" >
          <Splitter.Panel collapsible min="20%" defaultSize="70%">
            <Tag color="geekblue" style={{ width: '98%', textAlign: 'center' }} bordered={false}>🪲 测试用例</Tag>
            <FileTree
              onClick={async (filePath) => {
                const data = await window.electronAPI.openFile(filePath);
                setFileContent(data);
              }}
              onCreate={fetchData}
            />
          </Splitter.Panel>
          <Splitter.Panel collapsible min="20%" defaultSize="30%">
            <div style={{ border: '2px solid #F5F5F5', height: '100%' }}>
              <Tag color="geekblue" style={{ width: '98%', textAlign: 'center' }} bordered={false}>🚀 测试任务</Tag>
              <Tree.DirectoryTree treeData={treeData} checkable></Tree.DirectoryTree>
            </div>
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
      <Splitter.Panel collapsible>
        <FileContent content={fileContent} />
      </Splitter.Panel>
    </Splitter>
  );
};
const App: React.FC = () => {
  return (
    <Flex gap="middle" vertical>
      <CustomSplitter style={{ height: "97vh" }} />
    </Flex>
  );
};

export default App;
