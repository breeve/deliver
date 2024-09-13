import React, { useState, useEffect } from 'react';
import { Tree, Button, Input, Modal, message, Select, Form, Col, Row, Card } from 'antd';
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
    console.log('Generated YAML Content:', yamlContent); // Debug log
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
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const yamlContent = reader.result;
        try {
          const jsonData = yaml.load(yamlContent);
          console.log('Loaded JSON Data:', jsonData); // Debug log
          // Convert JSON to treeData format if necessary
          setTreeData(jsonData); // Assuming the JSON is already in the correct format
          saveToHistory(jsonData);
          updateYamlContent(jsonData);
        } catch (e) {
          message.error('YAML 解析错误');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Row>
      <Col span={12}>
        <Card title="树形结构" style={{ height: '100%', overflowY: 'auto', textAlign: 'left' }}>
          <Tree
            treeData={treeData}
            selectable
            draggable
            onSelect={onSelect}
            onDrop={onDrop}
            style={{ textAlign: 'left' }}
          />
        </Card>
        <Button onClick={addNode} type="primary">添加节点</Button>
        <Button onClick={deleteNode} type="danger">删除节点</Button>
        <Button onClick={undo} icon={<UndoOutlined />} disabled={historyIndex <= 0}>撤销</Button>
        <Button onClick={redo} icon={<RedoOutlined />} disabled={historyIndex >= history.length - 1}>重做</Button>
        <Button onClick={saveData} icon={<SaveOutlined />}>保存</Button>
        <Button onClick={exportYaml}>导出 YAML</Button>
        <input type="file" onChange={loadYamlFromFile} />
      </Col>
      <Col span={12}>
        <Card title="YAML Content" style={{ height: '100%', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
          <pre>{yamlContent}</pre>
        </Card>
      </Col>
      <Modal
        title="添加节点"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form>
          <Form.Item label="节点名称">
            <Input value={editingNode.name} onChange={(e) => setEditingNode({ ...editingNode, name: e.target.value })} />
          </Form.Item>
          <Form.Item label="节点类型">
            <Select value={editingNode.type} onChange={(value) => setEditingNode({ ...editingNode, type: value, defaultValue: getDefaultValueForType(value) })}>
              <Option value="string">String</Option>
              <Option value="int">Integer</Option>
              <Option value="float">Float</Option>
              <Option value="array">Array</Option>
              <Option value="map">Map</Option>
            </Select>
          </Form.Item>
          <Form.Item label="默认值">
            <Input value={editingNode.defaultValue} onChange={(e) => setEditingNode({ ...editingNode, defaultValue: e.target.value })} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="添加映射键"
        visible={isMapKeyModalVisible}
        onOk={handleMapOk}
        onCancel={() => setIsMapKeyModalVisible(false)}
      >
        <Form>
          <Form.Item label="Key">
            <Input value={editingMapKeyValue.key} onChange={(e) => setEditingMapKeyValue({ ...editingMapKeyValue, key: e.target.value })} />
          </Form.Item>
          <Form.Item label="值类型">
            <Select value={editingMapKeyValue.valueType} onChange={(value) => setEditingMapKeyValue({ ...editingMapKeyValue, valueType: value, value: getDefaultValueForType(value) })}>
              <Option value="string">String</Option>
              <Option value="int">Integer</Option>
              <Option value="float">Float</Option>
            </Select>
          </Form.Item>
          <Form.Item label="默认值">
            <Input value={editingMapKeyValue.value} onChange={(e) => setEditingMapKeyValue({ ...editingMapKeyValue, value: e.target.value })} />
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default DirectoryTreeExample;
