import React, { useState, useEffect } from 'react';
import { Tree, Button, Input, Modal, message, Select, Form } from 'antd';
import { UndoOutlined, RedoOutlined, SaveOutlined } from '@ant-design/icons';
import yaml from 'js-yaml';

const { Option } = Select;

const DirectoryTreeExample = () => {
  const [treeData, setTreeData] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMapKeyModalVisible, setIsMapKeyModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState({ name: '', type: 'string', defaultValue: '' });
  const [editingMapKeyValue, setEditingMapKeyValue] = useState({ key: '', valueType: 'string', value: '' });
  const [yamlContent, setYamlContent] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const getDefaultValueForType = (type) => {
    switch (type) {
      case 'int':
        return 0;
      case 'float':
        return 0.0;
      case 'string':
      case 'text':
        return '';
      case 'array':
        return [];
      case 'map':
        return {};
      default:
        return '';
    }
  };

  const saveToHistory = (newTreeData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTreeData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTreeData(history[historyIndex + 1]);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTreeData(history[historyIndex - 1]);
    }
  };

  const saveData = () => {
    localStorage.setItem('treeData', JSON.stringify(treeData));
    message.success('树结构已保存');
  };

  useEffect(() => {
    const savedTreeData = localStorage.getItem('treeData');
    if (savedTreeData) {
      setTreeData(JSON.parse(savedTreeData));
    }
  }, []);

  const onSelect = (selectedKeys) => {
    if (selectedKeys.length > 0) {
      setSelectedKey(selectedKeys[0]);
    } else {
      setSelectedKey(null);
    }
  };

  const addNode = () => {
    setEditingNode({ name: '', type: 'string', defaultValue: getDefaultValueForType('string') });
    setIsModalVisible(true);
  };

  const deleteNode = () => {
    if (!selectedKey) {
      message.error('请先选择一个节点');
      return;
    }
    Modal.confirm({
      title: '确认删除?',
      content: '删除后将无法恢复此节点',
      onOk: () => {
        const removeNode = (nodes, key) => {
          return nodes
            .map((node) => {
              if (node.key === key) {
                return null;
              } else if (node.children) {
                node.children = removeNode(node.children, key);
              }
              return node;
            })
            .filter((node) => node !== null);
        };
        const newTreeData = removeNode(treeData, selectedKey);
        setTreeData(newTreeData);
        saveToHistory(newTreeData);
        updateYamlContent(newTreeData);
      },
    });
  };

  const handleOk = () => {
    if (!editingNode.name.trim()) {
      message.error('名称不能为空');
      return;
    }

    const newTreeData = [...treeData];
    const newNode = {
      title: editingNode.name,
      key: selectedKey ? `${selectedKey}-${newTreeData.length}` : `${newTreeData.length}`,
      type: editingNode.type,
      defaultValue: editingNode.defaultValue,
      children: [],
    };

    if (treeData.length === 0 || !selectedKey) {
      newTreeData.push(newNode);
    } else {
      const parentNode = findNode(newTreeData, selectedKey);
      if (!parentNode || (parentNode.type !== 'array' && parentNode.type !== 'map')) {
        message.error('只能在数组或映射类型的节点下添加子节点');
        return;
      }
      parentNode.children = parentNode.children || [];
      parentNode.children.push(newNode);
    }

    setTreeData(newTreeData);
    saveToHistory(newTreeData);
    updateYamlContent(newTreeData);
    setIsModalVisible(false);
  };

  const handleMapOk = () => {
    if (!editingMapKeyValue.key.trim()) {
      message.error('Key 不能为空');
      return;
    }

    const parentNode = findNode(treeData, selectedKey);
    if (!parentNode || parentNode.type !== 'map') {
      message.error('此节点不是映射类型');
      return;
    }

    const newNode = {
      title: editingMapKeyValue.key,
      key: `${selectedKey}-${editingMapKeyValue.key}`,
      type: editingMapKeyValue.valueType,
      defaultValue: getDefaultValueForType(editingMapKeyValue.valueType),
    };

    parentNode.children = parentNode.children || [];
    parentNode.children.push(newNode);

    setTreeData([...treeData]);
    saveToHistory([...treeData]);
    updateYamlContent([...treeData]);
    setIsMapKeyModalVisible(false);
  };

  const findNode = (nodes, key) => {
    let result = null;
    nodes.forEach((node) => {
      if (node.key === key) {
        result = node;
      } else if (node.children) {
        result = findNode(node.children, key);
      }
    });
    return result;
  };

  const generateYaml = (nodes) => {
    const result = {};

    const processNode = (node) => {
      let value;
      switch (node.type) {
        case 'int':
          value = parseInt(node.defaultValue, 10);
          break;
        case 'float':
          value = parseFloat(node.defaultValue);
          break;
        case 'array':
          value = node.children && node.children.length > 0 ? node.children.map(processNode) : [];
          break;
        case 'map':
          value = node.children && node.children.length > 0 ? processNode(node.children) : {};
          break;
        default:
          value = node.defaultValue;
      }
      return { [node.title]: value };
    };

    nodes.forEach((node) => {
      Object.assign(result, processNode(node));
    });

    return yaml.dump(result, { lineWidth: -1 });
  };

  const updateYamlContent = (newTreeData) => {
    const yamlContent = generateYaml(newTreeData);
    setYamlContent(yamlContent);
  };

  const onDrop = (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dragNodeData = findNode(treeData, dragKey);

    const parentNode = findNode(treeData, dropKey);
    if (parentNode && (parentNode.type === 'array' || parentNode.type === 'map')) {
      const newTreeData = treeData.map((node) => {
        if (node.key === dropKey) {
          return { ...node, children: [...(node.children || []), dragNodeData] };
        }
        return node;
      });
      setTreeData(newTreeData);
      saveToHistory(newTreeData);
      updateYamlContent(newTreeData);
    }
  };

  const exportYaml = () => {
    const yamlContent = generateYaml(treeData);
    const blob = new Blob([yamlContent], { type: "text/yaml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tree.yaml";
    link.click();
  };

  const loadYamlFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const yamlContent = e.target.result;
      try {
        const parsedYaml = yaml.load(yamlContent);
        const newTreeData = convertYamlToTree(parsedYaml);
        setTreeData(newTreeData);
        saveToHistory(newTreeData);
      } catch (err) {
        message.error("YAML 文件解析失败");
      }
    };
    reader.readAsText(file);
  };

  const convertYamlToTree = (data) => {
    const convertToTree = (obj, parentKey = '') => {
      return Object.keys(obj).map((key) => {
        const value = obj[key];
        const nodeKey = parentKey ? `${parentKey}-${key}` : key;
  
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          return {
            title: key,
            key: nodeKey,
            type: 'map',
            children: convertToTree(value, nodeKey),
          };
        } else if (Array.isArray(value)) {
          return {
            title: key,
            key: nodeKey,
            type: 'array',
            children: value.map((item, index) => ({
              title: `${key}-${index}`,
              key: `${nodeKey}-${index}`,
              type: typeof item,
              defaultValue: item,
            })),
          };
        } else {
          return {
            title: key,
            key: nodeKey,
            type: typeof value,
            defaultValue: value,
          };
        }
      });
    };
  
    return convertToTree(data);
  };
  

  return (
    <div>
      <Button icon={<UndoOutlined />} onClick={undo}>撤销</Button>
      <Button icon={<RedoOutlined />} onClick={redo}>重做</Button>
      <Button icon={<SaveOutlined />} onClick={saveData}>保存</Button>
      <Button onClick={addNode}>添加节点</Button>
      <Button onClick={deleteNode}>删除节点</Button>
      <Button onClick={() => setIsMapKeyModalVisible(true)}>添加映射键</Button>
      <Button onClick={exportYaml}>导出 YAML</Button>
      <input type="file" accept=".yaml, .yml" onChange={loadYamlFromFile} />
      <Tree
        treeData={treeData}
        selectable
        draggable
        onSelect={onSelect}
        onDrop={onDrop}
      />
      <Modal
        title="添加节点"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="节点名称">
            <Input
              value={editingNode.name}
              onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="节点类型">
            <Select
              value={editingNode.type}
              onChange={(value) => setEditingNode({ ...editingNode, type: value })}
            >
              <Option value="string">字符串</Option>
              <Option value="int">整数</Option>
              <Option value="float">浮点数</Option>
              <Option value="array">数组</Option>
              <Option value="map">映射</Option>
            </Select>
          </Form.Item>
          <Form.Item label="默认值">
            <Input
              value={editingNode.defaultValue}
              onChange={(e) => setEditingNode({ ...editingNode, defaultValue: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="添加映射键"
        visible={isMapKeyModalVisible}
        onOk={handleMapOk}
        onCancel={() => setIsMapKeyModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="键">
            <Input
              value={editingMapKeyValue.key}
              onChange={(e) => setEditingMapKeyValue({ ...editingMapKeyValue, key: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="值类型">
            <Select
              value={editingMapKeyValue.valueType}
              onChange={(value) => setEditingMapKeyValue({ ...editingMapKeyValue, valueType: value })}
            >
              <Option value="string">字符串</Option>
              <Option value="int">整数</Option>
              <Option value="float">浮点数</Option>
              <Option value="array">数组</Option>
              <Option value="map">映射</Option>
            </Select>
          </Form.Item>
          <Form.Item label="值">
            <Input
              value={editingMapKeyValue.value}
              onChange={(e) => setEditingMapKeyValue({ ...editingMapKeyValue, value: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DirectoryTreeExample;
