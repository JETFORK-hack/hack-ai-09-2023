import { Alert, AutoComplete, Avatar, Badge, Button, Card, Col, Divider, Form, Input, List, Row, Space, Spin, Tag, Tooltip, Typography, message } from 'antd';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICardInfoById, ICartInfo } from '../components/CartInfo/CartInfo';
import axios from 'axios';
import { basePath } from '../providers/env';
import Meta from 'antd/es/card/Meta';
import debounce from 'lodash.debounce';
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';

const { Text } = Typography;


export const CartChecking = (): JSX.Element => {
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [cartInfo, setCartInfo] = useState<ICardInfoById>();
    const [cartId, setCartId] = useState<number>();

    const [searchOptions, setSearchOptions] = useState<number[]>([]);
    const [searchString, setSearchString] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const handleSearch = (value: string) => {
        setSearchOptions([]);
        if (!value) return;
        setIsSearching(true);
        axios.get<number[]>(basePath + '/api/v1/matching/receipts', { params: { id: value } })
            .then((response) => {
                console.log(response.data)
                setSearchOptions(response.data);
            })
            .catch(() => {
                message.error('Загрузка данных не удалась.');
            })
            .finally(() => {
                setIsSearching(false);
            });
    };

    const debouncedSearchHandler = useCallback(
        debounce(handleSearch, 550)
        , []);

    const onSearch = (searchText: string) => {
        if (!/^[0-9]*$/.test(searchText)) return;
        setSearchString(searchText);
        debouncedSearchHandler(searchText);
    };

    const onSelect = (_: string, item: { value: number, title: string }) => {
        console.log('onSelect', item.value);
        setSearchString(String(item.value));
        setSearchOptions([]);
        onFinish({ cart_id: item.value });
    };

    const onFinish = ({ cart_id }: { cart_id: number }) => {
        console.log('Success:', cart_id);
        setIsLoading(true);
        axios.get<ICardInfoById>(basePath + '/api/v1/matching/receipts_by_id', { params: { id: cart_id } })
            .then((response) => {
                console.log(response.data)
                if (response.data.items.length === 0) {
                    navigate('/cart');
                }
                setCartInfo(response.data)
                setCartId(cart_id)
            })

            .catch(() => {
                message.error('Загрузка не удалась.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <>
            <h1>Проверка корзины</h1>
            <Form
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 600 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item<string>
                    label="Идентификатор корзины"
                    name="cart_id"
                    rules={[
                        { required: true, message: 'Без идентификатора корзины нельзя подобрать товар' },
                        { required: true, message: 'Идентификатор должен быть положительным числом', pattern: new RegExp(/^[0-9]+$/) },
                    ]}
                >
                    {/* <Input /> */}
                    <AutoComplete
                        style={{ width: 500 }}
                        onSearch={onSearch}
                        onSelect={onSelect}
                        options={(searchOptions || []).map((d) => ({
                            value: d,
                            title: String(d),
                        }))}
                        notFoundContent={
                            <div style={{ textAlign: 'center' }}>{isSearching ? <Spin size="small" /> : <Typography.Text type='secondary'>Ничего не найдено</Typography.Text>}
                            </div>}
                        value={searchString}
                    >
                        <Input size="large" placeholder="00000000000" />
                    </AutoComplete>
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type="primary" htmlType="submit" loading={isLoading}>
                        Проверить
                    </Button>
                </Form.Item>
            </Form >
            {cartInfo?.items && cartInfo?.items.length > 0 && (
                <>
                    <br />
                    <h1>Элементы корзины №{cartId}</h1>
                    <List
                        itemLayout="horizontal"
                        dataSource={cartInfo.items}
                        renderItem={(item: ICartInfo, index) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar src={`https://xsgames.co/randomusers/avatar.php?g=pixel&key=${index}`} />}
                                    title={item.name}
                                    description={<Space direction="horizontal" split={'  '}>
                                        <div>Артикул: {item.item_id}</div>
                                        <div>{item.price}₽</div>
                                        <div>куплено - {item.quantity}</div>
                                        <Tag color="volcano">{item.category_noun}</Tag>
                                    </Space>}
                                />
                            </List.Item>
                        )}
                    />
                    <br />
                    {cartInfo.predict && cartInfo.predict.target && cartInfo.predict.candidate && (
                        <>
                            <h1>К этой корзине рекомендуем</h1>
                            <Row gutter={16} align='middle' justify='center'>
                                <Col sm={16} md={7}>
                                    <Card
                                        hoverable
                                        style={{ minWidth: 150, height: '45%' }}
                                        cover={<img alt="example" src="https://png.pngtree.com/png-vector/20190115/ourmid/pngtree-two-cartons-stacking-goods-commodity-png-image_367984.jpg" />}
                                    >
                                        <Meta title={<Tooltip title={cartInfo.predict.candidate.name}>{cartInfo.predict.candidate.name}</Tooltip>} description={<Space direction="horizontal" split={'  '}>
                                            <div>Артикул: {cartInfo.predict.candidate.item_id}</div>
                                            <div>Цена: {cartInfo.predict.candidate.price}₽</div>
                                            <Tooltip title={'Категория: ' + cartInfo.predict.candidate.category_noun}>
                                                <Tag color="volcano">{cartInfo.predict.candidate.category_noun}</Tag>
                                            </Tooltip>
                                        </Space>} />
                                    </Card>
                                </Col>
                                <Col sm={16} md={2} style={{ alignContent: 'center', justifyContent: 'center', display: 'flex' }}>
                                    {
                                        cartInfo.predict.target.item_id === cartInfo.predict.candidate.item_id ? (
                                            <CheckCircleTwoTone twoToneColor='#52c41a' style={{ fontSize: 50 }} />
                                        ) : (
                                            <></>
                                        )
                                    }
                                </Col>
                                <Col sm={16} md={7}>
                                    <Badge.Ribbon text="Куплено" color="cyan" placement='start'>
                                        <Card
                                            hoverable
                                            style={{ minWidth: 150, height: '45%' }}
                                            cover={<img alt="example" src="https://png.pngtree.com/png-vector/20190115/ourmid/pngtree-two-cartons-stacking-goods-commodity-png-image_367984.jpg" />}
                                        >
                                            <Meta title={<Tooltip title={cartInfo.predict.target.name}>{cartInfo.predict.target.name}</Tooltip>} description={<Space direction="horizontal" split={'  '}>
                                                <div>Артикул: {cartInfo.predict.target.item_id}</div>
                                                <div>Цена: {cartInfo.predict.target.price}₽</div>
                                                <Tooltip title={'Категория: ' + cartInfo.predict.target.category_noun}>
                                                    <Tag color="volcano">{cartInfo.predict.target.category_noun}</Tag>
                                                </Tooltip>
                                            </Space>} />
                                        </Card>
                                    </Badge.Ribbon>
                                </Col>
                            </Row>
                            {/* <Space direction="horizontal"
                                // size="middle"
                                size={16}
                                style={{ display: 'flex' }} split={<Divider />}>
                                <Badge.Ribbon text="Куплено" >
                                    <Card
                                        hoverable
                                        style={{ minWidth: 300, height: '45%' }}
                                        cover={<img alt="example" src="https://png.pngtree.com/png-vector/20190115/ourmid/pngtree-two-cartons-stacking-goods-commodity-png-image_367984.jpg" />}
                                    >
                                        <Meta title={cartInfo.predict.target.name} description={<Space direction="horizontal" split={'  '}>
                                            <div>Артикул: {cartInfo.predict.target.item_id}</div>
                                            <div>Цена: {cartInfo.predict.target.price}₽</div>
                                            <Tag color="volcano">{cartInfo.predict.target.category_noun}</Tag>
                                        </Space>} />
                                    </Card>
                                </Badge.Ribbon>
                                <Badge.Ribbon text="Рекомендовано" color="cyan" placement='start'>
                                    <Card
                                        hoverable
                                        style={{ minWidth: 200, height: '45%' }}
                                        cover={<img alt="example" src="https://png.pngtree.com/png-vector/20190115/ourmid/pngtree-two-cartons-stacking-goods-commodity-png-image_367984.jpg" />}
                                    >
                                        <Meta title={cartInfo.predict.candidate.name} description={<Space direction="horizontal" split={'  '}>
                                            <div>Артикул: {cartInfo.predict.candidate.item_id}</div>
                                            <div>Цена: {cartInfo.predict.candidate.price}₽</div>
                                            <Tag color="volcano">{cartInfo.predict.candidate.category_noun}</Tag>
                                        </Space>} />
                                    </Card>
                                </Badge.Ribbon>
                            </Space> */}
                        </>
                    )}
                </>
            )
            }
            {
                cartInfo?.items && cartInfo?.items.length === 0 && (
                    <>
                        <br />
                        <Alert
                            message="Корзина не найдена."
                            description="Проверьте правильность идентификатора корзины."
                            type='error'
                            showIcon
                        />
                    </>
                )
            }
        </>
    )
};
