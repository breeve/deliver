import React, { useState } from 'react';
import { Tree, Button, Input, message, Col, Row, Card } from 'antd';
import yaml from 'js-yaml';

const EditableTree = () => {
    const [treeData, setTreeData] = useState([]);
    const [editingKey, setEditingKey] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [yamlContent, setYamlContent] = useState('');

    const startEditing = (key, title) => {
        setEditingKey(key);
        setInputValue(title);
    };

    const saveEdit = (key) => {
        const updateTreeData = (data) => {
            return data.map((item) => {
                if (item.key === key) {
                    item.title = inputValue;
                }
                if (item.children) {
                    item.children = updateTreeData(item.children);
                }
                return item;
            });
        };

        const newTreeData = updateTreeData(treeData);
        setTreeData(newTreeData);
        setEditingKey(null);
        updateYamlContent(newTreeData)
    };

    const addNode = (key) => {
        const updateTreeData = (data) => {
            return data.map((item) => {
                if (item.key === key) {
                    item.children = item.children || [];
                    item.children.push({
                        title: 'New Node',
                        key: `${key}-${item.children.length}`,
                    });
                }
                if (item.children) {
                    item.children = updateTreeData(item.children);
                }
                return item;
            });
        };

        const newTreeData = updateTreeData(treeData);
        setTreeData(newTreeData);
        updateYamlContent(newTreeData)
    };

    const deleteNode = (key) => {
        const updateTreeData = (data) => {
            return data.filter((item) => {
                if (item.key === key) {
                    return false;
                }
                if (item.children) {
                    item.children = updateTreeData(item.children);
                }
                return true;
            });
        };

        const newTreeData = updateTreeData(treeData);
        setTreeData(newTreeData);
        updateYamlContent(newTreeData)
    };

    const loadYamlFromFile = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const yamlContent = reader.result;
                try {
                    const jsonData = yaml.load(yamlContent);
                    setTreeData(convertJsonToTreeData(jsonData));
                    updateYamlContent(convertJsonToTreeData(jsonData))
                } catch (e) {
                    message.error('YAML 解析失败');
                }
            };
            reader.readAsText(file);
        }
    };

    const convertJsonToTreeData = (jsonData) => {
        const transformNode = (data, keyPrefix = '') => {
            if (Array.isArray(data)) {
                return data.map((item, index) => ({
                    title: index.toString(),
                    key: `${keyPrefix}${index}`,
                    children: transformNode(item, `${keyPrefix}${index}-`),
                }));
            } else if (typeof data === 'object' && data !== null) {
                return Object.keys(data).map((key) => ({
                    title: key,
                    key: `${keyPrefix}${key}`,
                    children: transformNode(data[key], `${keyPrefix}${key}-`),
                }));
            } else {
                return [{
                    title: data.toString(),
                    key: `${keyPrefix}end`,
                }];
            }
        };
        return transformNode(jsonData);
    };

    const convertJsonToTreeDataError = (jsonData) => {
        const transformNode = (data, keyPrefix = '') => {
            if (Array.isArray(data)) {
                return data.map((item, index) => ({
                    title: index.toString(),
                    key: `${keyPrefix}${index}`,
                    children: transformNode(item, `${keyPrefix}${index}-`),
                    type: 'array',
                }));
            } else if (typeof data === 'object' && data !== null) {
                const retObj = {}
                Object.keys(data).map((key) => {
                    let ret
                    if (!((Array.isArray(data[key]) || (typeof data[key] === 'object' && data[key] != null)))) {
                        ret = {
                            title: key,
                            key: `${keyPrefix}${key}`,
                            type: 'normal',
                            value: data[key],
                        }
                    } else {
                        if (Array.isArray(data[key])) {
                            console.log(data[key])
                            const dataArray = data[key]
                            const retTmp = []
                            dataArray.map((item, index) => {
                                const nodeTmp = transformNode(item, index)
                                retTmp.push(nodeTmp)
                            })
                            ret = {
                                title: key,
                                key: `${keyPrefix}${key}`,
                                children: retTmp,
                                type: 'array',
                            }
                        } else {
                            ret = {
                                title: key,
                                key: `${keyPrefix}${key}`,
                                children: transformNode(data[key], `${keyPrefix}${key}-`),
                                type: 'object',
                            }
                        }
                    }

                    Object.assign(retObj, ret)
                });

                console.log(retObj)
                return retObj
            } else {
                return {
                    title: data.toString(),
                    key: `${keyPrefix}end`,
                    type: 'normal',
                };
            }
        };
        const ret = transformNode(jsonData);
        return ret
    };

    const updateTreeWithButtons = (data) => {
        return data.map((item) => {
            const titleElement = editingKey === item.key
                ? (
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={() => saveEdit(item.key)}
                        autoFocus
                    />
                ) : (
                    <>
                        <span>{item.title}</span>
                        <span style={{ float: 'right' }}>
                            <Button size="small" type="link" onClick={() => startEditing(item.key, item.title)}>编辑</Button>
                            <Button size="small" type="link" onClick={() => addNode(item.key)}>添加子节点</Button>
                            <Button size="small" type="link" danger onClick={() => deleteNode(item.key)}>删除</Button>
                        </span>
                    </>
                );

            return {
                ...item,
                title: titleElement, // Render title with buttons
                children: item.children ? updateTreeWithButtons(item.children) : undefined,
            };
        });
    };

    const generateYaml = (nodes) => {
        function buildYamlObject(obj) {
            const result = {};

            for (const item of obj) {
                const { title, type, value, children } = item;

                if (type === 'normal') {
                    result[title] = value;
                } else if (type === 'object' || type === 'array') {
                    if (type === 'object') {
                        if (!result[title]) {
                            result[title] = {}
                        }
                    }
                    if (type === 'array') {
                        console.log(item)
                    }

                    if (type === 'object') {
                        Object.assign(result[title], buildYamlObject(children));
                    } else {
                        for (const child of children) {
                            const a = buildYamlObject([child])
                            //result[title].push(a);
                            // Object.assign(result[title], a);
                            Object.assign(result, a);
                        }
                    }
                }
            }

            return result;
        }

        const intermediateObject = buildYamlObject(nodes);
        return yaml.dump(intermediateObject, { lineWidth: -1 });
    };

    const updateYamlContent = (newTreeData) => {
        const yamlContent = generateYaml(newTreeData);
        setYamlContent(yamlContent);
    };

    return (
        <Row>
            <Col span={12}>
                <Card title="树形结构" style={{ height: '100%', overflowY: 'auto', textAlign: 'left' }}>
                    <Tree
                        blockNode
                        treeData={updateTreeWithButtons(treeData)} // Apply the treeData with buttons
                        style={{ textAlign: 'left' }}
                    />
                </Card>
                <input type="file" onChange={loadYamlFromFile} />
            </Col>
            <Col span={12}>
                <Card title="YAML Content" style={{ height: '100%', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                    <pre style={{ textAlign: 'left' }}>{yamlContent}</pre>
                </Card>
            </Col>
        </Row>
    );
};

export default EditableTree;
