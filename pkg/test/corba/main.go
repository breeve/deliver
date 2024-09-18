package main

import (
	"fmt"
	"os"

	"github.com/mattn/go-shellwords"
	"github.com/spf13/cobra"
)

func main() {
	args, _ := shellwords.Parse("hello")

	var rootCmd = &cobra.Command{
		Use:   "app",
		Short: "这是一个简单的命令行工具",
		Long:  `这是一个使用 Cobra 创建的简单 Go 语言命令行工具示例。`,
	}

	var helloCmd = &cobra.Command{
		Use:   "hello",
		Short: "打印问候信息",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("你好，欢迎使用 Cobra!")
		},
	}

	rootCmd.AddCommand(helloCmd)

	rootCmd.SetArgs(args)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
