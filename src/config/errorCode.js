/**
 * 错误码与错误信息枚举
 * @description 统一管理系统所有业务错误码，便于前端识别与处理
 */

exports.errorCode = {
    UNKNOW: 200000,                     // 未知错误

    // 身份认证相关 (2001xx)
    AUTHENTICATIONFAILED: 200101,       // 身份认证失败
    TOKENEXPIRED: 200110,               // Token 已过期
    LOGINFAIL: 200111,                  // 登录失败
    WRONGPASSWORD: 200112,              // 密码错误

    // 用户相关 (2009xx)
    USERNOTEXIST: 200901,               // 用户不存在
    USERNAMEEXIST: 200902,              // 用户名已存在

    // 分类相关 (2010xx)
    CATEGORYNOTEXIST: 201001,           // 分类不存在
    CATEGORYNAMEEMPTY: 201002,          // 分类名不能为空

    // 标签相关 (2011xx)
    TAGNOTEXIST: 201101,                // 标签不存在
    TAGNAMEEXIST: 201102,               // 标签名已存在
    TAGNAMEEMPTY: 201103,               // 标签名不能为空

    // 文章相关 (2012xx)
    ARTICLENOTEXIST: 201201,            // 文章不存在
    ARTICLETITLEEMPTY: 201202,          // 文章标题不能为空

    // 项目相关 (2013xx)
    PROJECTNOTEXIST: 201301,            // 项目不存在
    PROJECTNAMEEMPTY: 201302,           // 项目名不能为空

    // 文件上传相关 (2014xx)
    FILECANNOTBEEMPTY: 201401,          // 文件不能为空
    FILETYPENOTSUPPORT: 201402,         // 文件类型不支持

    // 参数校验相关 (3001xx)
    PARAMERROR: 300100,                 // 参数错误
}

exports.errorMessage = {
    UNKNOW: '服务器内部错误，请稍后再试！',
    AUTHENTICATIONFAILED: '身份认证失败！',
    TOKENEXPIRED: '登录已过期，请重新登录！',
    LOGINFAIL: '登录失败！',
    WRONGPASSWORD: '用户名或密码错误！',
    USERNOTEXIST: '用户不存在！',
    USERNAMEEXIST: '用户名已存在！',
    CATEGORYNOTEXIST: '分类不存在！',
    CATEGORYNAMEEMPTY: '分类名称不能为空！',
    TAGNOTEXIST: '标签不存在！',
    TAGNAMEEXIST: '标签名称已存在！',
    TAGNAMEEMPTY: '标签名称不能为空！',
    ARTICLENOTEXIST: '文章不存在！',
    ARTICLETITLEEMPTY: '文章标题不能为空！',
    PROJECTNOTEXIST: '项目不存在！',
    PROJECTNAMEEMPTY: '项目名称不能为空！',
    FILECANNOTBEEMPTY: '请选择要上传的文件！',
    FILETYPENOTSUPPORT: '仅支持图片和 PDF 格式文件！',
    PARAMERROR: '请求参数错误！',
}
