import { useState, ReactNode } from 'react'
import { useBaby } from '../App'
import { Select, Tag, Button, Modal, Form, Input, Radio, DatePicker, App as AntdApp } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { api, genderOptions } from '../api'
import dayjs from 'dayjs'

interface Props {
  children?: ReactNode
  showHeader?: boolean
  title?: string
  description?: string
}

export default function BabySelector({ children, showHeader = true, title, description }: Props) {
  const { babies, selectedBaby, setSelectedBaby, refreshBabies } = useBaby()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const antdApp = AntdApp.useApp()

  const handleCreate = async (values: any) => {
    try {
      await api.createBaby({
        ...values,
        birth_date: values.birth_date.format('YYYY-MM-DD'),
      })
      antdApp.message.success('创建成功')
      setModalOpen(false)
      form.resetFields()
      refreshBabies()
    } catch (e: any) {
      antdApp.message.error('创建失败')
    }
  }

  return (
    <>
      <div className="baby-selector">
        <div style={{ fontWeight: 600, color: '#444', minWidth: 80 }}>当前宝宝：</div>
        <Select
          style={{ minWidth: 220 }}
          value={selectedBaby?.id}
          onChange={(v) => {
            const b = babies.find((x) => x.id === v) || null
            setSelectedBaby(b)
          }}
          options={babies.map((b) => ({
            value: b.id,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{b.name}</span>
                <Tag color={b.gender === 'M' ? 'blue' : b.gender === 'F' ? 'pink' : 'default'}>
                  {b.gender === 'M' ? '男宝' : b.gender === 'F' ? '女宝' : '未知'}
                </Tag>
                <span style={{ color: '#888', fontSize: 12 }}>
                  {b.current_age_months}个月
                </span>
              </div>
            ),
          }))}
        />
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          添加宝宝
        </Button>
        <div style={{ flex: 1 }} />
        {selectedBaby && (
          <div style={{ color: '#888', fontSize: 13 }}>
            出生日期：{selectedBaby.birth_date}
          </div>
        )}
      </div>

      {showHeader && (
        <div className="page-header">
          <h2 className="page-title">{title}</h2>
          <div className="page-description">{description}</div>
        </div>
      )}

      <div className="page-content">
        {children}
      </div>

      <Modal
        title="添加宝宝档案"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="宝宝昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="如：小汤圆" />
          </Form.Item>
          <Form.Item name="gender" label="性别" rules={[{ required: true }]} initialValue="U">
            <Radio.Group options={genderOptions} />
          </Form.Item>
          <Form.Item name="birth_date" label="出生日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isAfter(dayjs())} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
