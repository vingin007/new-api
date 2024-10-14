import React, { useEffect, useState } from 'react';
import { Card, Spin } from '@douyinfe/semi-ui';
import SettingsGeneral from '../pages/Setting/Operation/SettingsGeneral.js';
import SettingsDrawing from '../pages/Setting/Operation/SettingsDrawing.js';
import SettingsSensitiveWords from '../pages/Setting/Operation/SettingsSensitiveWords.js';
import SettingsLog from '../pages/Setting/Operation/SettingsLog.js';
import SettingsDataDashboard from '../pages/Setting/Operation/SettingsDataDashboard.js';
import SettingsMonitoring from '../pages/Setting/Operation/SettingsMonitoring.js';
import SettingsCreditLimit from '../pages/Setting/Operation/SettingsCreditLimit.js';
import SettingsMagnification from '../pages/Setting/Operation/SettingsMagnification.js';

import { API, showError, showSuccess } from '../helpers';
import SettingsChats from '../pages/Setting/Operation/SettingsChats.js';

const OperationSetting = () => {
  let now = new Date();
  let [inputs, setInputs] = useState({
    QuotaForNewUser: 0,
    QuotaForInviter: 0,
    TopUpForInviter: 0,
    QuotaForInvitee: 0,
    QuotaRemindThreshold: 0,
    PreConsumedQuota: 0,
    StreamCacheQueueLength: 0,
    ModelRatio: '',
    CompletionRatio: '',
    ModelPrice: '',
    GroupRatio: '',
    UserUsableGroups: '',
    TopUpLink: '',
    ChatLink: '',
    ChatLink2: '', // 添加的新状态变量
    QuotaPerUnit: 0,
    AutomaticDisableChannelEnabled: false,
    AutomaticEnableChannelEnabled: false,
    ChannelDisableThreshold: 0,
    LogConsumeEnabled: false,
    DisplayInCurrencyEnabled: false,
    DisplayTokenStatEnabled: false,
    CheckSensitiveEnabled: false,
    CheckSensitiveOnPromptEnabled: false,
    CheckSensitiveOnCompletionEnabled: '',
    StopOnSensitiveEnabled: '',
    SensitiveWords: '',
    MjNotifyEnabled: false,
    MjAccountFilterEnabled: false,
    MjModeClearEnabled: false,
    MjForwardUrlEnabled: false,
    MjActionCheckSuccessEnabled: false,
    DrawingEnabled: false,
    DataExportEnabled: false,
    DataExportDefaultTime: 'hour',
    DataExportInterval: 5,
    DefaultCollapseSidebar: false, // 默认折叠侧边栏
    RetryTimes: 0,
    Chats: "[]",
  });

  let [loading, setLoading] = useState(false);

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (
          item.key === 'ModelRatio' ||
          item.key === 'GroupRatio' ||
          item.key === 'UserUsableGroups' ||
          item.key === 'CompletionRatio' ||
          item.key === 'ModelPrice'
        ) {
          item.value = JSON.stringify(JSON.parse(item.value), null, 2);
        }
        if (
          item.key.endsWith('Enabled') ||
          ['DefaultCollapseSidebar'].includes(item.key)
        ) {
          newInputs[item.key] = item.value === 'true' ? true : false;
        } else {
          newInputs[item.key] = item.value;
        }
      });
      setInputs(newInputs);
    } else {
      showError(message);
    }
  };
  async function onRefresh() {
    try {
      setLoading(true);
      await getOptions();
      showSuccess('刷新成功');
    } catch (error) {
      showError('刷新失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    onRefresh();
  }, []);

  const updateOption = async (key, value) => {
    setLoading(true);
    if (key.endsWith('Enabled')) {
      value = inputs[key] === 'true' ? 'false' : 'true';
    }
    if (key === 'DefaultCollapseSidebar') {
      value = inputs[key] === 'true' ? 'false' : 'true';
    }
    console.log(key, value);
    const res = await API.put('/api/option/', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      setInputs((inputs) => ({ ...inputs, [key]: value }));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const handleInputChange = async (e, { name, value }) => {
    if (
      name.endsWith('Enabled') ||
      name === 'DataExportInterval' ||
      name === 'DataExportDefaultTime' ||
      name === 'DefaultCollapseSidebar'
    ) {
      if (name === 'DataExportDefaultTime') {
        localStorage.setItem('data_export_default_time', value);
      } else if (name === 'MjNotifyEnabled') {
        localStorage.setItem('mj_notify_enabled', value);
      }
      await updateOption(name, value);
    } else {
      setInputs((inputs) => ({ ...inputs, [name]: value }));
    }
  };

  const submitConfig = async (group) => {
    switch (group) {
      case 'monitor':
        if (
          originInputs['ChannelDisableThreshold'] !==
          inputs.ChannelDisableThreshold
        ) {
          await updateOption(
            'ChannelDisableThreshold',
            inputs.ChannelDisableThreshold,
          );
        }
        if (
          originInputs['QuotaRemindThreshold'] !== inputs.QuotaRemindThreshold
        ) {
          await updateOption(
            'QuotaRemindThreshold',
            inputs.QuotaRemindThreshold,
          );
        }
        break;
      case 'ratio':
        if (originInputs['ModelRatio'] !== inputs.ModelRatio) {
          if (!verifyJSON(inputs.ModelRatio)) {
            showError('模型倍率不是合法的 JSON 字符串');
            return;
          }
          await updateOption('ModelRatio', inputs.ModelRatio);
        }
        if (originInputs['CompletionRatio'] !== inputs.CompletionRatio) {
          if (!verifyJSON(inputs.CompletionRatio)) {
            showError('模型补全倍率不是合法的 JSON 字符串');
            return;
          }
          await updateOption('CompletionRatio', inputs.CompletionRatio);
        }
        if (originInputs['GroupRatio'] !== inputs.GroupRatio) {
          if (!verifyJSON(inputs.GroupRatio)) {
            showError('分组倍率不是合法的 JSON 字符串');
            return;
          }
          await updateOption('GroupRatio', inputs.GroupRatio);
        }
        if (originInputs['ModelPrice'] !== inputs.ModelPrice) {
          if (!verifyJSON(inputs.ModelPrice)) {
            showError('模型固定价格不是合法的 JSON 字符串');
            return;
          }
          await updateOption('ModelPrice', inputs.ModelPrice);
        }
        break;
      case 'words':
        if (originInputs['SensitiveWords'] !== inputs.SensitiveWords) {
          await updateOption('SensitiveWords', inputs.SensitiveWords);
        }
        break;
      case 'quota':
        if (originInputs['QuotaForNewUser'] !== inputs.QuotaForNewUser) {
          await updateOption('QuotaForNewUser', inputs.QuotaForNewUser);
        }
        if (originInputs['QuotaForInvitee'] !== inputs.QuotaForInvitee) {
          await updateOption('QuotaForInvitee', inputs.QuotaForInvitee);
        }
        if (originInputs['QuotaForInviter'] !== inputs.QuotaForInviter) {
          await updateOption('QuotaForInviter', inputs.QuotaForInviter);
        }
        if (originInputs['PreConsumedQuota'] !== inputs.PreConsumedQuota) {
          await updateOption('PreConsumedQuota', inputs.PreConsumedQuota);
        }
        break;
      case 'general':
        if (originInputs['TopUpLink'] !== inputs.TopUpLink) {
          await updateOption('TopUpLink', inputs.TopUpLink);
        }
        if (originInputs['ChatLink'] !== inputs.ChatLink) {
          await updateOption('ChatLink', inputs.ChatLink);
        }
        if (originInputs['ChatLink2'] !== inputs.ChatLink2) {
          await updateOption('ChatLink2', inputs.ChatLink2);
        }
        if (originInputs['QuotaPerUnit'] !== inputs.QuotaPerUnit) {
          await updateOption('QuotaPerUnit', inputs.QuotaPerUnit);
        }
        if (originInputs['RetryTimes'] !== inputs.RetryTimes) {
          await updateOption('RetryTimes', inputs.RetryTimes);
        }
        break;
    }
  };

  const deleteHistoryLogs = async () => {
    console.log(inputs);
    const res = await API.delete(
      `/api/log/?target_timestamp=${Date.parse(historyTimestamp) / 1000}`,
    );
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(`${data} 条日志已清理！`);
      return;
    }
    showError('日志清理失败：' + message);
  };
  return (
    <>
      <Spin spinning={loading} size='large'>
        {/* 通用设置 */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsGeneral options={inputs} refresh={onRefresh} />
        </Card>
        {/* 绘图设置 */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsDrawing options={inputs} refresh={onRefresh} />
        </Card>
        {/* 屏蔽词过滤设置 */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsSensitiveWords options={inputs} refresh={onRefresh} />
        </Card>
        {/* 日志设置 */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsLog options={inputs} refresh={onRefresh} />
        </Card>
        {/* 数据看板 */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsDataDashboard options={inputs} refresh={onRefresh} />
        </Card>
        {/* 监控设置 */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsMonitoring options={inputs} refresh={onRefresh} />
        </Card>
        {/* 额度设置 */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsCreditLimit options={inputs} refresh={onRefresh} />
        </Card>
        {/* 聊天设置 */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsChats options={inputs} refresh={onRefresh} />
        </Card>
        {/* 倍率设置 */}
        <Card style={{ marginTop: '10px' }}>
          <SettingsMagnification options={inputs} refresh={onRefresh} />
        </Card>
      </Spin>
    </>
  );
};

export default OperationSetting;
