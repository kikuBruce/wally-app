import React, { useEffect, useState } from "react";
import { Button, Dropdown, Form, Input, message, Modal, Tree } from "antd";
import type { GetProps, MenuProps, TreeDataNode } from "antd";
import { PythonOutlined } from "@ant-design/icons";

type DirectoryTreeProps = GetProps<typeof Tree.DirectoryTree>;

const { DirectoryTree } = Tree;

const formatTreeData = async (dirPath: string): Promise<TreeDataNode[]> => {
  const files: { name: string; path: string; isDirectory: boolean }[] =
    await window.electronAPI.readDirectory(dirPath);

  return files.map((file) => ({
    title: file.name,
    key: file.path,
    isLeaf: !file.isDirectory,
    children: file.isDirectory ? [] : undefined,
    icon: file.path.toString().endsWith('.py') && <PythonOutlined />
  }));
};

const FileTree: React.FC<{
  onClick: (filePath: string) => void,
  onCreate: () => void
}> = (props) => {

  const { onClick } = props;

  const [messageApi, contextHolder] = message.useMessage();

  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [currentDir, setCurrentDir] = useState("");
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      window.electronAPI.cacheStoreGet('projectPath')
        .then((res: string | undefined) => {
          res && loadPath(res)
        })
    }
    fetchData()
  }, [])

  const loadPath = async (path: string) => {
    setCurrentDir(path);
    const treeData = await formatTreeData(path)
    setTreeData(treeData);
  }

  const handleSelectDir = async () => {
    const dir = await window.electronAPI.openDirectory();
    if (dir) {
      window.electronAPI.cacheStoreSet('projectPath', dir)
      loadPath(dir)
    }
  };

  const onLoadData: DirectoryTreeProps["loadData"] = async ({ key }) => {
    const children = await formatTreeData(key.toString());
    setTreeData((prev) => updateTreeData(prev, key.toString(), children));
  };

  const updateTreeData = (
    list: TreeDataNode[],
    key: string,
    children: TreeDataNode[],
  ): TreeDataNode[] => {
    return list.map((node) => {
      if (node.key === key) {
        return { ...node, children };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        };
      }
      return node;
    });
  };

  const items: MenuProps['items'] = [
    {
      label: '创建任务',
      key: '1',
    },
  ];

  const onCreateClick: MenuProps['onClick'] = () => {
    if (checkedKeys.length >= 1) {
      setIsModalOpen(true)
    } else {
      messageApi.open({
        type: 'warning',
        content: '请勾选用例文件',
      });
    }
  };

  return (
    <div>
      {contextHolder}
      <div
        style={{
          margin: 5,
          height: 40,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 5,
          padding: 5,
          gap: 5,
        }}
      >
        <Input value={currentDir} style={{ flex: 1, minWidth: 50 }} />
        <Button onClick={handleSelectDir}>select</Button>
      </div>
      <hr style={{ backgroundColor: "#F5F5F5", height: 2, border: "none" }} />
      <Dropdown menu={{ items, onClick: onCreateClick }} trigger={['contextMenu']}>
        <DirectoryTree
          loadData={onLoadData}
          treeData={treeData}
          onCheck={(checks) => {
            const filteredKeys = (checks as string[]).filter((key) => key.endsWith(".py"));
            setCheckedKeys(filteredKeys as React.Key[]);

          }}
          checkable
          style={{
            whiteSpace: 'nowrap'
          }}
          onSelect={(_, info) => onClick(info.node.key.toString())}
          onRightClick={() => { console.log(checkedKeys) }}
        />
      </Dropdown>
      <Modal
        title="创建任务"
        open={isModalOpen}
        onOk={async () => {
          console.log(form.getFieldsValue())
          const taskName = form.getFieldValue('taskName')
          if (!taskName) {
            messageApi.open({
              type: 'error',
              content: '请输入任务名称'
            })
            return
          }

          const taskAlreadyExists = await window.electronAPI.taskStoreGet(taskName)
          if (!taskAlreadyExists) {
            window.electronAPI.taskStoreSet(taskName, checkedKeys)
              .then(() => {
                messageApi.open({
                  type: 'success',
                  content: '创建成功'
                })
                setIsModalOpen(false)
                props.onCreate()
              })
          } else {
            messageApi.open({
              type: 'error',
              content: '任务已存在'
            })
          }
        }}
        onCancel={() => setIsModalOpen(false)}
        width={'60vw'}
      >
        <Form
          form={form}
        >
          <Form.Item name='taskName'>
            <Input placeholder="测试任务名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FileTree;
